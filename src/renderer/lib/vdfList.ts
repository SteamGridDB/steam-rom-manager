import { VDFListData, PreviewData, VDFListHubFileData, ImageContent } from "../models";
import { without, omitBy, isNil } from "lodash";
import { Http, ResponseContentType, Headers } from '@angular/http';
import * as paths from "../../shared/paths";
import * as crc from 'crc';
import * as long from 'long';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';

export class VDFList {
    private listData: VDFListData = {};

    constructor(private http: Http) { }

    populateList(steamDirectories: string[]) {
        return this.getRequiredVDFFiles(steamDirectories).then((directoryData) => {
            let errors: string[] = [];
            let userIdFound: boolean = false;
            for (let i = 0; i < directoryData.length; i++) {
                if (directoryData[i].error)
                    errors.push(directoryData[i].error);
                else {
                    userIdFound = true;
                    this.listData[directoryData[i].data.directory] = {};
                    for (let j = 0; j < directoryData[i].data.files.length; j++) {
                        let file = directoryData[i].data.files[j];
                        let userId = this.getUserId(file);

                        if (this.listData[directoryData[i].data.directory][userId] === undefined)
                            this.listData[directoryData[i].data.directory][userId] = { screenshots: undefined, shortcuts: undefined };

                        if (path.basename(file) === 'shortcuts.vdf')
                            this.listData[directoryData[i].data.directory][userId].shortcuts = { filename: file, data: null };
                        else
                            this.listData[directoryData[i].data.directory][userId].screenshots = { filename: file, data: null };
                    }
                }
            }

            if (!userIdFound)
                throw new Error("None of provided steam directories contained user directories.");

            return this.readAllVDFs().then(() => {
                return errors;
            });
        });
    }

    createBackups() {
        let promises: Promise<void[]>[] = [];
        for (let steamDirectory in this.listData) {
            promises.push(this.createBackup(steamDirectory));
        }
        return Promise.all(promises).catch((error) => {
            throw new Error(`Error encountered while making backups. ${error}`);
        });
    }

    removeEntriesAndImages(previewData: PreviewData) {
        let promises: Promise<string[]>[] = [];
        for (let steamDirectory in this.listData) {
            let newTitles: string[] = [];
            for (let title in previewData) {
                if (previewData[title].steamDirectories[steamDirectory] !== undefined)
                    newTitles.push(title);
            }
            promises.push(this.removeEntriesAndImagesInDir(steamDirectory, newTitles));
        }
        return Promise.all(promises).then((errors) => {
            return this.flattenErrors(errors);
        });
    }

    saveEntriesAndImages(previewData: PreviewData) {
        let promises: Promise<string[]>[] = [];
        for (let steamDirectory in this.listData) {
            let newTitles: string[] = [];
            for (let title in previewData) {
                if (previewData[title].steamDirectories[steamDirectory] !== undefined)
                    newTitles.push(title);
            }
            promises.push(this.saveEntriesAndImagesInDir(steamDirectory, newTitles, previewData));
        }
        return Promise.all(promises).then((errors) => {
            return this.flattenErrors(errors);
        });
    }

    private createBackup(steamDirectory: string) {
        let promises: Promise<void>[] = [];
        for (let userId in this.listData[steamDirectory]) {
            promises.push(new Promise<void>((resolve, reject) => {
                fs.copy(this.listData[steamDirectory][userId].screenshots.filename, path.join(path.dirname(this.listData[steamDirectory][userId].screenshots.filename), 'screenshots.firstbackup'), { overwrite: false }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
                fs.copy(this.listData[steamDirectory][userId].screenshots.filename, path.join(path.dirname(this.listData[steamDirectory][userId].screenshots.filename), 'screenshots.backup'), { overwrite: true }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
            }));
            promises.push(new Promise<void>((resolve, reject) => {
                fs.copy(this.listData[steamDirectory][userId].shortcuts.filename, path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), 'shortcuts.firstbackup'), { overwrite: false }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
                fs.copy(this.listData[steamDirectory][userId].shortcuts.filename, path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), 'shortcuts.backup'), { overwrite: true }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
            }));
        }
        return Promise.all(promises);
    }

    private saveEntriesAndImagesInDir(steamDirectory: string, newTitles: string[], previewData: PreviewData) {
        let promises: Promise<string[]>[] = [];
        for (let userId in this.listData[steamDirectory]) {
            promises.push(new Promise((resolve, reject) => {
                let newLocalEntries: VDFListHubFileData[] = [];
                let screenshotEntries = this.getScreenshotsData(steamDirectory, userId);
                let shortcutEntries = this.getShortcutsData(steamDirectory, userId);

                for (let i = 0; i < newTitles.length; i++) {
                    let exe = '"' + previewData[newTitles[i]].steamDirectories[steamDirectory].executableLocation + '"',
                        appId = this.generateAppId(exe, newTitles[i]);

                    shortcutEntries.push({
                        AppName: newTitles[i],
                        exe: exe,
                        StartDir: '"' + path.dirname(previewData[newTitles[i]].steamDirectories[steamDirectory].executableLocation) + path.sep + '"',
                        LaunchOptions: previewData[newTitles[i]].steamDirectories[steamDirectory].argumentString,
                        tags: previewData[newTitles[i]].steamDirectories[steamDirectory].steamCategories
                    });

                    screenshotEntries[appId] = newTitles[i];
                    newLocalEntries.push({ entry: newTitles[i], image: appId });
                }

                this.saveVDF(steamDirectory, userId).then(() => {
                    let innerPromises: Promise<string>[] = [];
                    let mimeTypes = require('mime-types');
                    let toBuffer = require('blob-to-buffer');
                    let gridFolder: string = path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), 'grid');
                    innerPromises.push(new Promise((innerResolve, innerReject) => {
                        fs.writeFile(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), paths.savedListFilename), JSON.stringify(newLocalEntries, null, 4), (err) => {
                            if (err)
                                innerReject(err);
                            else
                                innerResolve();
                        });
                    }));
                    for (let i = 0; i < newLocalEntries.length; i++) {
                        let index = previewData[newLocalEntries[i].entry].currentImageIndex;
                        if (previewData[newLocalEntries[i].entry].images.value.content && previewData[newLocalEntries[i].entry].images.value.content[index]) {
                            let image: ImageContent = previewData[newLocalEntries[i].entry].images.value.content[index];
                            innerPromises.push(new Promise((innerResolve, innerReject) => {
                                this.http.get(image.imageUrl, {
                                    headers: new Headers({ 'Content-type': 'image' }),
                                    responseType: ResponseContentType.Blob
                                }).timeout(120000).map((response) => {
                                    return response.blob();
                                }).subscribe(
                                    (blob) => {
                                        let ext: string | boolean = mimeTypes.extension(blob.type);
                                        if (ext === false)
                                            innerResolve('Item title - ' + newLocalEntries[i].entry + '. Error - mime type (' + blob.type + ') is unsupported.');
                                        else {
                                            toBuffer(blob, (error: Error, buffer: Buffer) => {
                                                if (error)
                                                    innerResolve('Item title - ' + newLocalEntries[i].entry + '. Error - ' + error.message);
                                                else {
                                                    fs.outputFile(path.join(gridFolder, newLocalEntries[i].image + '.' + ext), buffer, (error) => {
                                                        if (error)
                                                            innerResolve('Item title - ' + newLocalEntries[i].entry + '. Error - ' + error.message);
                                                        else
                                                            innerResolve();
                                                    })
                                                }
                                            });
                                        }
                                    },
                                    (error) => {
                                        innerResolve(error);
                                    });
                            }));
                        }
                    }
                    return Promise.all(innerPromises);
                }).then((errors) => {
                    resolve(this.validateErrors(errors));
                }).catch((error) => {
                    reject(error);
                });
            }));
        }
        return Promise.all(promises).then((errors) => {
            return this.flattenErrors(errors);
        });
    }

    private removeEntriesAndImagesInDir(steamDirectory: string, newTitles: string[]) {
        let promises: Promise<string[]>[] = [];
        for (let userId in this.listData[steamDirectory]) {
            promises.push(new Promise((resolve, reject) => {
                fs.readFile(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), paths.savedListFilename), 'utf8', (error, data) => {
                    let titlesToRemove: VDFListHubFileData[] = [];
                    if (error) {
                        if (error.code !== 'ENOENT')
                            return reject(error.message);
                    }
                    else
                        titlesToRemove.concat(JSON.parse(data));

                    for (let i = 0; i < newTitles.length; i++) {
                        if (titlesToRemove.findIndex(item => item.entry === newTitles[i]) === -1)
                            titlesToRemove.push({ entry: newTitles[i], image: undefined });
                    }

                    let screenshotEntries = this.getScreenshotsData(steamDirectory, userId);
                    let shortcutEntries = this.getShortcutsData(steamDirectory, userId);

                    for (let image in screenshotEntries) {
                        let index = titlesToRemove.findIndex((item) => { return item.entry === screenshotEntries[image]; });
                        if (index !== -1)
                            titlesToRemove[index].image = image;
                    }

                    for (let i = 0; i < titlesToRemove.length; i++) {
                        if (titlesToRemove[i].image && screenshotEntries[titlesToRemove[i].image])
                            screenshotEntries[titlesToRemove[i].image] = undefined;
                    }

                    for (let i = 0; i < shortcutEntries.length; i++) {
                        if (titlesToRemove.findIndex(item => item.entry === shortcutEntries[i]['AppName']) !== -1)
                            shortcutEntries[i] = undefined;
                    }

                    this.setScreenshotsData(steamDirectory, userId, omitBy(screenshotEntries, isNil));
                    this.setShortcutsData(steamDirectory, userId, without(shortcutEntries, undefined));

                    let innerPromises: Promise<string>[] = [];
                    let gridFolder: string = path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.filename), 'grid');
                    for (let i = 0; i < titlesToRemove.length; i++) {
                        if (titlesToRemove[i].image) {
                            innerPromises.push(new Promise((globResolve) => {
                                glob(titlesToRemove[i].image + '.*', { silent: true, dot: true, cwd: gridFolder }, (err, files) => {
                                    if (err)
                                        globResolve(err.message);
                                    else {
                                        for (let i = 0; i < files.length; i++)
                                            fs.removeSync(path.join(gridFolder, files[i]));

                                        globResolve();
                                    }
                                });
                            }));
                        }
                    }
                    Promise.all(innerPromises).then((errors) => {
                        return this.saveVDF(steamDirectory, userId).then(() => {
                            return errors;
                        });
                    }).then((errors) => resolve(this.validateErrors(errors))).catch((error) => reject(error));
                });
            }));
        }
        return Promise.all(promises).then((errors) => {
            return this.flattenErrors(errors);
        });
    }

    private setScreenshotsData(steamDirectory: string, userId: string, data: any) {
        this.listData[steamDirectory][userId].screenshots.data['Screenshots']['shortcutnames'] = data;
    }

    private getScreenshotsData(steamDirectory: string, userId: string): any {
        return this.listData[steamDirectory][userId].screenshots.data['Screenshots']['shortcutnames'];
    }

    private setShortcutsData(steamDirectory: string, userId: string, data: any[]) {
        this.listData[steamDirectory][userId].shortcuts.data['shortcuts'] = data;
    }

    private getShortcutsData(steamDirectory: string, userId: string): any[] {
        return this.listData[steamDirectory][userId].shortcuts.data['shortcuts'];
    }

    private getUserId(filename: string) {
        return /userdata(\\|\/)(.*?)(\\|\/)/i.exec(filename)[2];
    }

    private getRequiredVDFFiles(steamDirectories: string[]) {
        let promises: Promise<{ data: { directory: string, files: string[] }, error: string }>[] = [];
        for (let i = 0; i < steamDirectories.length; i++) {
            promises.push(new Promise<{ data: { directory: string, files: string[] }, error: string }>((resolve, reject) => {
                glob('userdata/*/', { silent: true, dot: true, cwd: steamDirectories[i] }, (error, folders) => {
                    if (error)
                        reject(error);
                    else if (folders.length === 0) {
                        resolve({ data: null, error: '"' + steamDirectories[i] + '" contains no user ids.' });
                    }
                    else {
                        let files: string[] = [];
                        for (let j = 0; j < folders.length; j++)
                            files.push(path.join(steamDirectories[i], folders[j], 'config', 'shortcuts.vdf'), path.join(steamDirectories[i], folders[j], '760', 'screenshots.vdf'));

                        resolve({ data: { directory: steamDirectories[i], files: files }, error: null });
                    }
                });
            }));
        }
        return Promise.all(promises);
    }

    private readAllVDFs() {
        let promises: Promise<string[]>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.readVDF(steamDirectory, userId));
            }
        }

        return Promise.all(promises);
    }

    private readVDF(steamDirectory: string, userId: string) {
        let shortcutsParser = require('steam-shortcut-editor');
        let screenshotsParser = require('vdf');
        let promises: Promise<any>[] = []

        promises.push(new Promise((resolve, reject) => {
            fs.readFile(this.listData[steamDirectory][userId].shortcuts.filename, 'utf8', (err, data) => {
                try {
                    if (err && err.code !== 'ENOENT')
                        reject(err);
                    else {
                        if (data)
                            this.listData[steamDirectory][userId].shortcuts.data = shortcutsParser.parse(data);
                        else
                            this.listData[steamDirectory][userId].shortcuts.data = {};

                        if (this.listData[steamDirectory][userId].shortcuts.data['shortcuts'] === undefined)
                            this.listData[steamDirectory][userId].shortcuts.data['shortcuts'] = [];

                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }));
        promises.push(new Promise((resolve, reject) => {
            fs.readFile(this.listData[steamDirectory][userId].screenshots.filename, 'utf8', (err, data) => {
                try {
                    if (err && err.code !== 'ENOENT')
                        reject(err);
                    else {
                        if (data)
                            this.listData[steamDirectory][userId].screenshots.data = screenshotsParser.parse(data);
                        else
                            this.listData[steamDirectory][userId].screenshots.data = {};

                        if (this.listData[steamDirectory][userId].screenshots.data['Screenshots'] === undefined) {
                            this.listData[steamDirectory][userId].screenshots.data['Screenshots'] = { 'shortcutnames': {} };
                        }
                        else if (this.listData[steamDirectory][userId].screenshots.data['Screenshots']['shortcutnames'] === undefined) {
                            this.listData[steamDirectory][userId].screenshots.data['Screenshots']['shortcutnames'] = {};
                        }
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }));

        return Promise.all(promises);
    }

    private saveAllVDFs() {
        let promises: Promise<any>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.saveVDF(steamDirectory, userId));
            }
        }

        return Promise.all(promises);
    }

    private saveVDF(steamDirectory: string, userId: string) {
        let shortcutsParser = require('steam-shortcut-editor');
        let screenshotsParser = require('vdf');
        let promises: Promise<any>[] = []

        promises.push(new Promise((resolve, reject) => {
            let data = shortcutsParser.stringify(this.listData[steamDirectory][userId].shortcuts.data);
            fs.outputFile(this.listData[steamDirectory][userId].shortcuts.filename, data, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }));
        promises.push(new Promise((resolve, reject) => {
            let data = screenshotsParser.dump(this.listData[steamDirectory][userId].screenshots.data);
            fs.outputFile(this.listData[steamDirectory][userId].screenshots.filename, data, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }));

        return Promise.all(promises);
    }

    private generateAppId(quotedExecutableLocation: string, title: string) {
        //From https://github.com/Hafas/node-steam-shortcuts

        let crcValue = crc.crc32(quotedExecutableLocation + title);
        let longValue = new long(crcValue, crcValue, true);
        longValue = longValue.or(0x80000000);
        longValue = longValue.shl(32);
        longValue = longValue.or(0x02000000);
        return longValue.toString();
    }

    private validateErrors(errors: string[]) {
        return without(errors, undefined);
    }

    private flattenErrors(errors: string[][]) {
        let flatErrors: string[] = [];
        for (let i = 0; i < errors.length; i++)
            flatErrors = flatErrors.concat(errors[i]);
        return flatErrors;
    }
}