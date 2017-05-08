import { VDFListData, VDFListFileData, PreviewData } from "../models";
import { omitBy, unionBy, cloneDeep, pullAllBy, without, isNil } from "lodash";
import { Http, ResponseContentType, Headers } from '@angular/http';
import * as glob from 'glob';
import * as path from 'path';
import * as crc from 'crc';
import * as long from 'long';
import * as fs from 'fs-extra';
import * as paths from "../../shared/paths";

export class VdfManager {
    private listData: VDFListData = {};

    constructor(private http: Http) { }

    populateList(steamDirectories: string[]) {
        return new Promise<string[]>((resolve, reject) => {
            if (steamDirectories.length > 0) {
                this.retrieveMultipleVDFPaths(steamDirectories).then((data) => {
                    let errors: string[] = [];
                    let userFound: boolean = false;
                    let getUserId = function (filename: string) {
                        return /userdata(\\|\/)(.*?)(\\|\/)/i.exec(filename)[2];
                    }

                    for (let i = 0; i < data.length; i++) {
                        if (data[i].error)
                            errors.push(data[i].error);
                        else {
                            userFound = true;
                            this.listData[data[i].data.directory] = {};
                            for (let j = 0; j < data[i].data.files.length; j++) {
                                let file = data[i].data.files[j];
                                let userId = getUserId(file);

                                if (this.listData[data[i].data.directory][userId] === undefined)
                                    this.listData[data[i].data.directory][userId] = { screenshots: undefined, shortcuts: undefined };

                                if (path.basename(file) === 'shortcuts.vdf')
                                    this.listData[data[i].data.directory][userId].shortcuts = { path: file, data: null };
                                else
                                    this.listData[data[i].data.directory][userId].screenshots = { path: file, data: null };
                            }
                        }
                    }

                    if (!userFound)
                        throw new Error("none of provided steam directories contained user directories.");
                    else
                        resolve(errors);
                }).catch((error) => {
                    reject(new Error(`could not populate VDF list. ${error}`))
                });
            }
            else {
                reject(new Error('cannot populate list from empty directory list.'))
            }
        });
    }

    private retrieveVDFPaths(steamDirectory: string) {
        return new Promise<{ data: { directory: string, files: string[] }, error: string }>((resolve, reject) => {
            glob('userdata/*/', { silent: true, dot: true, cwd: steamDirectory }, (error, folders) => {
                if (error)
                    reject(error);
                else if (folders.length === 0) {
                    resolve({ data: null, error: `"${steamDirectory}" contains no user ids.` });
                }
                else {
                    let files: string[] = [];
                    for (let j = 0; j < folders.length; j++) {
                        files.push(path.join(steamDirectory, folders[j], 'config', 'shortcuts.vdf'),
                            path.join(steamDirectory, folders[j], '760', 'screenshots.vdf'));
                    }
                    resolve({ data: { directory: steamDirectory, files: files }, error: null });
                }
            });
        });
    }

    private retrieveMultipleVDFPaths(steamDirectories: string[]) {
        let promises: Promise<{ data: { directory: string, files: string[] }, error: string }>[] = [];
        for (let i = 0; i < steamDirectories.length; i++) {
            promises.push(this.retrieveVDFPaths(steamDirectories[i]));
        }
        return Promise.all(promises);
    }

    private readShortcutsVDF(steamDirectory: string, userId: string) {
        return new Promise((resolve, reject) => {
            let shortcutsParser = require('steam-shortcut-editor');
            fs.readFile(this.listData[steamDirectory][userId].shortcuts.path, (err, data) => {
                try {
                    if (err && err.code !== 'ENOENT')
                        reject(err);
                    else {
                        if (data)
                            this.listData[steamDirectory][userId].shortcuts.data = shortcutsParser.parseBuffer(data);
                        else
                            this.listData[steamDirectory][userId].shortcuts.data = {};

                        if (this.listData[steamDirectory][userId].shortcuts.data['shortcuts'] === undefined)
                            this.listData[steamDirectory][userId].shortcuts.data['shortcuts'] = [];

                        resolve();
                    }
                } catch (error) {
                    reject(new Error(`Error reading "${this.listData[steamDirectory][userId].shortcuts.path}". ${error}`));
                }
            });
        });
    }

    private writeShortcutsVDF(steamDirectory: string, userId: string) {
        return new Promise((resolve, reject) => {
            let shortcutsParser = require('steam-shortcut-editor');
            let data = shortcutsParser.writeBuffer(this.listData[steamDirectory][userId].shortcuts.data);
            fs.outputFile(this.listData[steamDirectory][userId].shortcuts.path, data, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }).catch((error) => {
            throw new Error(`Error writing "${this.listData[steamDirectory][userId].shortcuts.path}". ${error}`);
        });
    }

    private readScreenshotsVDF(steamDirectory: string, userId: string) {
        return new Promise((resolve, reject) => {
            let screenshotsParser = require('vdf');
            fs.readFile(this.listData[steamDirectory][userId].screenshots.path, 'utf8', (err, data) => {
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
                    reject(new Error(`Error reading "${this.listData[steamDirectory][userId].screenshots.path}". ${error}`));
                }
            });
        });
    }

    private writeScreenshotsVDF(steamDirectory: string, userId: string) {
        return new Promise((resolve, reject) => {
            let screenshotsParser = require('vdf');
            let data = screenshotsParser.dump(this.listData[steamDirectory][userId].screenshots.data);
            fs.outputFile(this.listData[steamDirectory][userId].screenshots.path, data, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }).catch((error) => {
            throw new Error(`Error writing "${this.listData[steamDirectory][userId].screenshots.path}". ${error}`);
        });
    }

    readAllVDFs() {
        let promisePushed = false;
        let promises: Promise<any>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promisePushed = true;
                promises.push(this.readShortcutsVDF(steamDirectory, userId));
                promises.push(this.readScreenshotsVDF(steamDirectory, userId));
            }
        }

        if (!promisePushed)
            throw new Error(`could not read VDFs. The populated list is empty.`);

        return Promise.all(promises);
    }

    writeAllVDFs() {
        let promisePushed = false;
        let promises: Promise<any>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promisePushed = true;
                promises.push(this.writeShortcutsVDF(steamDirectory, userId));
                promises.push(this.writeScreenshotsVDF(steamDirectory, userId));
            }
        }

        if (!promisePushed)
            throw new Error(`could not write VDFs. The populated list is empty.`);

        return Promise.all(promises);
    }

    private createBackup(steamDirectory: string) {
        let promises: Promise<void>[] = [];
        for (let userId in this.listData[steamDirectory]) {
            promises.push(new Promise<void>((resolve, reject) => {
                fs.copy(this.listData[steamDirectory][userId].screenshots.path, path.join(path.dirname(this.listData[steamDirectory][userId].screenshots.path), 'screenshots.firstbackup'), { overwrite: false }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
                fs.copy(this.listData[steamDirectory][userId].screenshots.path, path.join(path.dirname(this.listData[steamDirectory][userId].screenshots.path), 'screenshots.backup'), { overwrite: true }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
            }));
            promises.push(new Promise<void>((resolve, reject) => {
                fs.copy(this.listData[steamDirectory][userId].shortcuts.path, path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), 'shortcuts.firstbackup'), { overwrite: false }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
                fs.copy(this.listData[steamDirectory][userId].shortcuts.path, path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), 'shortcuts.backup'), { overwrite: true }, (error: any) => {
                    if (error && error.code !== 'ENOENT')
                        reject(error);
                    else
                        resolve();
                });
            }));
        }
        return Promise.all(promises);
    }

    createBackups() {
        let promisePushed = false;
        let promises: Promise<void[]>[] = [];
        for (let steamDirectory in this.listData) {
            promisePushed = true;
            promises.push(this.createBackup(steamDirectory));
        }
        if (!promisePushed)
            throw new Error(`could not create backups. The populated list is empty.`);
        return Promise.all(promises).catch((error) => {
            throw new Error(`could not create backups. ${error}`);
        });
    }

    private readVDFListData(steamDirectory: string, userId: string) {
        return new Promise<VDFListFileData[]>((resolve, reject) => {
            fs.readFile(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), paths.savedListFilename), 'utf8', (error, data) => {
                if (error) {
                    if (error.code !== 'ENOENT')
                        return reject(error);
                    else
                        resolve([]);
                }
                else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    }

    private writeVDFListData(steamDirectory: string, userId: string, data: VDFListFileData[]) {
        return new Promise((resolve, reject) => {
            fs.outputFile(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), paths.savedListFilename), JSON.stringify(data, null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
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

    private generateAppId(quotedExecutableLocation: string, title: string) {
        //From https://github.com/Hafas/node-steam-shortcuts

        let crcValue = crc.crc32(quotedExecutableLocation + title);
        let longValue = new long(crcValue, crcValue, true);
        longValue = longValue.or(0x80000000);
        longValue = longValue.shl(32);
        longValue = longValue.or(0x02000000);
        return longValue.toString();
    }

    private downloadImage(steamDirectory: string, userId: string, data: { appId: string, title: string, url: string }) {
        return new Promise<string>((resolve) => {
            let mimeTypes = require('mime-types');
            let toBuffer = require('blob-to-buffer');

            this.http.get(data.url, {
                headers: new Headers({ 'Content-type': 'image' }),
                responseType: ResponseContentType.Blob
            }).timeout(120000).map((response) => {
                return response.blob();
            }).subscribe(
                (blob) => {
                    let ext: string | boolean = mimeTypes.extension(blob.type);
                    if (ext === false)
                        resolve(`Entry title - ${data.title}. Error - mime type (${blob.type}) is unsupported.`);
                    else {
                        toBuffer(blob, (error: Error, buffer: Buffer) => {
                            if (error)
                                resolve(`Entry title - ${data.title}. ${error}`);
                            else {
                                let gridDirectory: string = path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), 'grid');
                                fs.outputFile(path.join(gridDirectory, data.appId + '.' + ext), buffer, (error) => {
                                    if (error)
                                        resolve(`Entry title - ${data.title}. ${error}`);
                                    else
                                        resolve();
                                })
                            }
                        });
                    }
                },
                (error) => {
                    resolve(`Entry title - ${data.title}. ${error}`);
                });
        }).catch((error) => { throw new Error(`downloading image (${data.title}: ${data.url}). ${error}`) });
    }

    private removeImages(steamDirectory: string, userId: string, appIds: string[]) {
        return new Promise((resolve, reject) => {
            if (appIds.length === 0)
                resolve();

            let promises: Promise<any>[] = [];
            let screenshotsData = this.getScreenshotsData(steamDirectory, userId);
            for (let i = 0; i < appIds.length; i++) {
                screenshotsData[appIds[i]] = undefined;
                promises.push(new Promise((globResolve, globReject) => {
                    let gridDirectory: string = path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), 'grid');
                    glob(appIds[i] + '.*', { silent: true, dot: true, cwd: gridDirectory }, (err, files) => {
                        if (err)
                            globReject(err);
                        else {
                            for (let i = 0; i < files.length; i++) {
                                try {
                                    fs.removeSync(path.join(gridDirectory, files[i]));
                                } catch (error) {
                                    if (error.code !== 'ENOENT')
                                        return globReject(error);
                                }
                            }

                            globResolve();
                        }
                    });
                }));
            }
            this.setScreenshotsData(steamDirectory, userId, omitBy(screenshotsData, isNil));
            Promise.all(promises).then(() => resolve()).catch((errors) => reject(errors));
        });
    }

    private addImages(steamDirectory: string, userId: string, data: { appId: string, title: string, url: string }[]) {
        return new Promise<string[]>((resolve, reject) => {
            if (data.length === 0)
                resolve();

            let promises: Promise<string>[] = [];
            let screenshotsData = this.getScreenshotsData(steamDirectory, userId);
            for (let i = 0; i < data.length; i++) {
                screenshotsData[data[i].appId] = data[i].title;
                promises.push(this.downloadImage(steamDirectory, userId, data[i]));
            }
            this.setScreenshotsData(steamDirectory, userId, screenshotsData);
            Promise.all(promises).then((errors) => resolve(errors)).catch((errors) => reject(errors));
        });
    }

    private mergeEntriesAndImages(steamDirectory: string, userId: string, previewData: PreviewData) {
        return new Promise<string[]>((resolve, reject) => {
            let errors: string[] = [];
            let currentEntries: VDFListFileData[] = [];
            let newEntries: VDFListFileData[] = [];
            let imagesToRemove: string[] = [];
            let imagesToAdd: { appId: string, title: string, url: string }[] = [];
            let shortcutsData = this.getShortcutsData(steamDirectory, userId);

            let getEntry = function (shortcutsData: any[], title: string) {
                for (let i = 0; i < shortcutsData.length; i++) {
                    let appName = shortcutsData[i].appname || shortcutsData[i].AppName;
                    if (appName === title)
                        return i;
                }
                return -1;
            }

            this.readVDFListData(steamDirectory, userId).then((readData) => {
                currentEntries = readData;

                for (let title in previewData) {
                    if (previewData[title].steamDirectories[steamDirectory] === undefined)
                        continue;

                    let index = getEntry(shortcutsData, title);

                    let executableLocation = previewData[title].steamDirectories[steamDirectory].executableLocation;
                    let argumentString = previewData[title].steamDirectories[steamDirectory].argumentString;
                    let steamCategories = previewData[title].steamDirectories[steamDirectory].steamCategories;

                    let appId = this.generateAppId(`"${executableLocation}"`, title);

                    if (index !== -1) {
                        if (shortcutsData[index].AppName !== undefined)
                            shortcutsData[index].AppName = title;
                        else
                            shortcutsData[index].appname = title;

                        shortcutsData[index].exe = `"${executableLocation}"`;
                        shortcutsData[index].StartDir = `"${path.dirname(executableLocation) + path.sep}"`;
                        shortcutsData[index].LaunchOptions = argumentString;
                        shortcutsData[index].tags = steamCategories;
                    }
                    else {
                        shortcutsData.push({
                            appname: title,
                            exe: `"${executableLocation}"`,
                            StartDir: `"${path.dirname(executableLocation) + path.sep}"`,
                            LaunchOptions: argumentString,
                            tags: steamCategories
                        });
                    }

                    imagesToRemove.push(appId);

                    newEntries.push({ imageBasename: appId, title: title });

                    let imageIndex = previewData[title].currentImageIndex;
                    let images = previewData[title].images.value.content;

                    if (images && images[imageIndex] && images[imageIndex].imageUrl)
                        imagesToAdd.push({ appId: appId, title: title, url: images[imageIndex].imageUrl });
                }

                return this.removeImages(steamDirectory, userId, imagesToRemove);
            }).then(() => {
                return this.addImages(steamDirectory, userId, imagesToAdd);
            }).then((downloadErrors) => {
                errors = without(downloadErrors, undefined);
                let mergedEntries: VDFListFileData[] = unionBy(currentEntries, newEntries, 'title');
                return this.writeVDFListData(steamDirectory, userId, mergedEntries);
            }).then(() => resolve(errors)).catch((error) => reject(error));
        });
    }

    mergeVDFEntriesAndReplaceImages(previewData: PreviewData) {
        let promisePushed = false;
        let promises: Promise<string[]>[] = [];
        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promisePushed = true;
                promises.push(this.mergeEntriesAndImages(steamDirectory, userId, previewData));
            }
        }
        if (!promisePushed)
            throw new Error(`could not merge entries and/or replace images. The populated list is empty.`);
        return Promise.all(promises).then((errors) => {
            return [].concat.apply([], errors);
        }).catch((error) => {
            throw new Error(`could not merge entries and/or replace images. ${error}`);
        });;
    }

    private removeEntriesAndImages(steamDirectory: string, userId: string, previewData?: PreviewData) {
        return new Promise((resolve, reject) => {
            let currentEntries: VDFListFileData[] = [];
            let entriesToRemove: VDFListFileData[] = [];
            let imagesToRemove: string[] = [];
            let shortcutsData = this.getShortcutsData(steamDirectory, userId);

            let getEntry = function (shortcutsData: any[], title: string) {
                for (let i = 0; i < shortcutsData.length; i++) {
                    if (shortcutsData[i]) {
                        let appName = shortcutsData[i].appname || shortcutsData[i].AppName;
                        if (appName === title)
                            return i;
                    }
                }
                return -1;
            }

            this.readVDFListData(steamDirectory, userId).then((readData) => {
                currentEntries = readData;

                if (previewData !== undefined) {
                    for (let title in previewData) {
                        if (previewData[title].steamDirectories[steamDirectory] === undefined)
                            continue;

                        let index = getEntry(shortcutsData, title);

                        if (index !== -1) {
                            let executableLocation = previewData[title].steamDirectories[steamDirectory].executableLocation;
                            let appId = this.generateAppId(`"${executableLocation}"`, title);

                            imagesToRemove.push(appId);
                            entriesToRemove.push({ imageBasename: appId, title: title });
                            shortcutsData[index] = undefined;
                        }
                    }

                    this.setShortcutsData(steamDirectory, userId, without(shortcutsData, isNil));
                }
                else {
                    entriesToRemove = cloneDeep(currentEntries);
                    for (let i = 0; i < entriesToRemove.length; i++) {
                        let index = getEntry(shortcutsData, entriesToRemove[i].title);

                        if (index !== -1)
                            shortcutsData[index] = undefined;

                        imagesToRemove.push(entriesToRemove[i].imageBasename);
                    }
                    this.setShortcutsData(steamDirectory, userId, without(shortcutsData, isNil));
                }

                return this.removeImages(steamDirectory, userId, imagesToRemove);
            }).then(() => {
                let mergedEntries: VDFListFileData[] = pullAllBy(currentEntries, entriesToRemove, 'title');
                return this.writeVDFListData(steamDirectory, userId, mergedEntries);
            }).then(() => resolve()).catch((error) => reject(error));
        });
    }

    removeVDFEntriesAndImages(previewData?: PreviewData) {
        let promisePushed = false;
        let promises: Promise<string[]>[] = [];
        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promisePushed = true;
                promises.push(this.removeEntriesAndImages(steamDirectory, userId, previewData));
            }
        }
        if (!promisePushed)
            throw new Error(`could not remove entries and/or images. The populated list is empty.`);
        return Promise.all(promises).catch((error) => {
            throw new Error(`could not remove entries and/or images. ${error}`);
        });;
    }
}