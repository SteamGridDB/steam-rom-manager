import { VDFListData, VDFListFileData, PreviewData, PreviewDataApps, SteamShortcutsData } from "../models";
import { Http, ResponseContentType, Headers } from '@angular/http';
import { generateAppId } from "./steam-id-helpers";
import { readJson, writeJson } from "../../shared/lib";
import { gApp } from "../app.global";
import * as glob from 'glob';
import * as _ from "lodash";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as paths from "../../shared/paths";

export class VdfManager {
    private listData: VDFListData = {};

    constructor(private http: Http) { }

    private get lang() {
        return gApp.lang.vdfManager;
    }

    populateListFromPreviewData(previewData: PreviewData) {
        return Promise.resolve().then(() => {
            let userFound: boolean = false;
            for (let directory in previewData) {
                for (let user in previewData[directory]) {
                    userFound = true;
                    if (this.listData[directory] === undefined)
                        this.listData[directory] = {};

                    if (this.listData[directory][user] === undefined) {
                        this.listData[directory][user] = {
                            screenshots: {
                                path: path.join(directory, 'userdata', user, '760', 'screenshots.vdf'),
                                data: null
                            },
                            shortcuts: {
                                path: path.join(directory, 'userdata', user, 'config', 'shortcuts.vdf'),
                                data: null
                            }
                        };
                    }
                }
            }
            if (!userFound)
                throw new Error(this.lang.error.noUsersFound);
        });
    }

    populateListFromDirectoryList(steamDirectories: string[]) {
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
                        throw new Error(this.lang.error.noUsersFound);
                    else
                        resolve(errors);
                }).catch((error) => {
                    reject(new Error(this.lang.error.couldNotPopulateList__i.interpolate({
                        error: error
                    })));
                });
            }
            else {
                reject(new Error(this.lang.error.emptyDirectoryList));
            }
        });
    }

    private retrieveVDFPaths(steamDirectory: string) {
        return new Promise<{ data: { directory: string, files: string[] }, error: string }>((resolve, reject) => {
            glob('userdata/*/', { silent: true, dot: true, cwd: steamDirectory }, (error, folders) => {
                if (error)
                    reject(error);
                else if (folders.length === 0) {
                    resolve({ data: null, error: this.lang.error.noUserIdsInDir__i.interpolate({ steamDirectory: steamDirectory }) });
                }
                else {
                    let files: string[] = [];
                    for (let j = 0; j < folders.length; j++) {
                        files.push(
                            path.join(steamDirectory, folders[j], 'config', 'shortcuts.vdf'),
                            path.join(steamDirectory, folders[j], '760', 'screenshots.vdf')
                        );
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
                    reject(new Error(this.lang.error.readingVdf__i.interpolate({
                        filePath: this.listData[steamDirectory][userId].shortcuts.path,
                        error: error
                    })));
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
            throw new Error(this.lang.error.writingVdf__i.interpolate({
                filePath: this.listData[steamDirectory][userId].shortcuts.path,
                error: error
            }));
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
                    reject(new Error(this.lang.error.readingVdf__i.interpolate({
                        filePath: this.listData[steamDirectory][userId].screenshots.path,
                        error: error
                    })));
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
            throw new Error(this.lang.error.writingVdf__i.interpolate({
                filePath: this.listData[steamDirectory][userId].screenshots.path,
                error: error
            }));
        });
    }

    readAllVDFs() {
        let promises: Promise<any>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.readShortcutsVDF(steamDirectory, userId));
                promises.push(this.readScreenshotsVDF(steamDirectory, userId));
            }
        }

        return Promise.all(promises);
    }

    writeAllVDFs() {
        let promises: Promise<any>[] = []

        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.writeShortcutsVDF(steamDirectory, userId));
                promises.push(this.writeScreenshotsVDF(steamDirectory, userId));
            }
        }

        return Promise.all(promises);
    }

    private createBackup(filename: string, newFilename: string, overwrite: boolean = false) {
        return new Promise<void>((resolve, reject) => {
            fs.copy(filename, newFilename, { overwrite: overwrite }, (error: any) => {
                if (error && error.code !== 'ENOENT')
                    reject(error);
                else
                    resolve();
            });
        });
    }

    createBackups() {
        let promises: Promise<void>[] = [];
        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                let user = this.listData[steamDirectory][userId];
                promises.push(this.createBackup(user.screenshots.path, path.join(path.dirname(user.screenshots.path), 'screenshots.firstbackup')));
                promises.push(this.createBackup(user.screenshots.path, path.join(path.dirname(user.screenshots.path), 'screenshots.backup'), true));
                promises.push(this.createBackup(user.shortcuts.path, path.join(path.dirname(user.shortcuts.path), 'shortcuts.firstbackup')));
                promises.push(this.createBackup(user.shortcuts.path, path.join(path.dirname(user.shortcuts.path), 'shortcuts.backup'), true));
            }
        }

        return Promise.all(promises).catch((error) => {
            throw new Error(this.lang.error.creatingBackups__i.interpolate({ error: error }));
        });
    }

    private readVDFListData(steamDirectory: string, userId: string) {
        return readJson<VDFListFileData[]>(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), paths.savedListFilename), []);
    }

    private writeVDFListData(steamDirectory: string, userId: string, data: VDFListFileData[]) {
        return writeJson(path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), paths.savedListFilename), data);
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
                        resolve(this.lang.error.unsupportedMimeType__i.interpolate({ type: blob.type, title: data.title }));
                    else {
                        toBuffer(blob, (error: Error, buffer: Buffer) => {
                            if (error)
                                resolve(this.lang.error.imageError__i.interpolate({ error: error, title: data.title }));
                            else {
                                let gridDirectory: string = path.join(path.dirname(this.listData[steamDirectory][userId].shortcuts.path), 'grid');
                                fs.outputFile(path.join(gridDirectory, data.appId + '.' + ext), buffer, (error) => {
                                    if (error)
                                        resolve(this.lang.error.imageError__i.interpolate({ error: error, title: data.title }));
                                    else
                                        resolve();
                                })
                            }
                        });
                    }
                },
                (error) => {
                    resolve(this.lang.error.imageError__i.interpolate({ error: error, title: data.title }));
                });
        }).catch((error) => { throw new Error(this.lang.error.fatalImageError__i.interpolate({ error: error, title: data.title, url: data.url })) });
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
            this.setScreenshotsData(steamDirectory, userId, _.omitBy(screenshotsData, _.isNil));
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

    private mergeEntriesAndImages(steamDirectory: string, userId: string, apps: PreviewDataApps) {
        return new Promise<string[]>((resolve, reject) => {
            let errors: string[] = [];
            let currentEntries: VDFListFileData[] = [];
            let newEntries: VDFListFileData[] = [];
            let imagesToRemove: string[] = [];
            let imagesToAdd: { appId: string, title: string, url: string }[] = [];
            let shortcutsData = this.getShortcutsData(steamDirectory, userId);

            let getEntry = function (shortcutsData: any[], appID: string) {
                for (let i = 0; i < shortcutsData.length; i++) {
                    if (shortcutsData[i]) {
                        let appName = shortcutsData[i].appname || shortcutsData[i].AppName;
                        let exe = shortcutsData[i].exe;
                        if (appID === generateAppId(exe, appName))
                            return i;
                    }
                }
                return -1;
            }

            this.readVDFListData(steamDirectory, userId).then((readData) => {
                currentEntries = readData;

                for (let appID in apps) {
                    let app = apps[appID];
                    let index = getEntry(shortcutsData, appID);

                    let executableLocation = app.executableLocation;
                    let argumentString = app.argumentString;
                    let steamCategories = app.steamCategories;

                    if (index !== -1) {
                        if (shortcutsData[index].AppName !== undefined)
                            shortcutsData[index].AppName = app.title;
                        else
                            shortcutsData[index].appname = app.title;

                        shortcutsData[index].exe = executableLocation;
                        shortcutsData[index].StartDir = `"${path.dirname(executableLocation.match(/"(.*?)"/)[1]) + path.sep}"`;
                        shortcutsData[index].LaunchOptions = argumentString;
                        shortcutsData[index].tags = steamCategories;
                        if (app.icons.length > 0) {
                            shortcutsData[index].icon = app.icons[app.currentIconIndex];
                        }
                    }
                    else {
                        shortcutsData.push(Object.assign(
                            {
                                appname: app.title,
                                exe: executableLocation,
                                StartDir: `"${path.dirname(executableLocation.match(/"(.*?)"/)[1]) + path.sep}"`,
                                LaunchOptions: argumentString,
                                tags: steamCategories
                            },
                            app.icons.length > 0 && { icon: app.icons[app.currentIconIndex] }
                        ));
                    }

                    newEntries.push(appID);

                    let imageIndex = app.currentImageIndex;
                    let images = app.images.value.content;

                    if (images && images.length > 0) {
                        if (imageIndex !== -1 && images[imageIndex] && images[imageIndex].imageUrl) {
                            imagesToRemove.push(appID);
                            imagesToAdd.push({ appId: appID, title: app.title, url: images[imageIndex].imageUrl });
                        }
                    }
                }

                return this.removeImages(steamDirectory, userId, imagesToRemove);
            }).then(() => {
                return this.addImages(steamDirectory, userId, imagesToAdd);
            }).then((downloadErrors) => {
                errors = _.without(downloadErrors, undefined);
                let mergedEntries: VDFListFileData[] = _.union(currentEntries, newEntries);
                return this.writeVDFListData(steamDirectory, userId, mergedEntries);
            }).then(() => resolve(errors)).catch((error) => reject(error));
        });
    }

    mergeVDFEntriesAndReplaceImages(previewData: PreviewData) {
        let promises: Promise<string[]>[] = [];
        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.mergeEntriesAndImages(steamDirectory, userId, previewData[steamDirectory][userId].apps));
            }
        }

        return Promise.all(promises).then((errors) => {
            return [].concat.apply([], errors);
        }).catch((error) => {
            throw new Error(this.lang.error.couldNotMergeEntries__i.interpolate({ error: error }));
        });;
    }

    private removeEntriesAndImages(steamDirectory: string, userId: string, apps?: PreviewDataApps) {
        return new Promise<void>((resolve, reject) => {
            let currentEntries: VDFListFileData[] = [];
            let entriesToRemove: VDFListFileData[] = [];
            let imagesToRemove: string[] = [];
            let shortcutsData = this.getShortcutsData(steamDirectory, userId);

            let getEntry = function (shortcutsData: any[], appID: string) {
                for (let i = 0; i < shortcutsData.length; i++) {
                    if (shortcutsData[i]) {
                        let appName = shortcutsData[i].appname || shortcutsData[i].AppName;
                        let exe = shortcutsData[i].exe;
                        if (appID === generateAppId(exe, appName))
                            return i;
                    }
                }
                return -1;
            }

            this.readVDFListData(steamDirectory, userId).then((readData) => {
                currentEntries = readData;

                if (apps !== undefined) {
                    for (let appID in apps) {
                        let index = getEntry(shortcutsData, appID);

                        if (index !== -1) {
                            imagesToRemove.push(appID);
                            entriesToRemove.push(appID);
                            shortcutsData[index] = undefined;
                        }
                    }

                    this.setShortcutsData(steamDirectory, userId, _.without(shortcutsData, null, undefined, ""));
                }
                else {
                    entriesToRemove = _.cloneDeep(currentEntries);
                    for (let i = 0; i < entriesToRemove.length; i++) {
                        let index = getEntry(shortcutsData, entriesToRemove[i]);

                        if (index !== -1)
                            shortcutsData[index] = undefined;

                        imagesToRemove.push(entriesToRemove[i]);
                    }
                    this.setShortcutsData(steamDirectory, userId, _.without(shortcutsData, null, undefined, ""));
                }

                return this.removeImages(steamDirectory, userId, imagesToRemove);
            }).then(() => {
                let mergedEntries: VDFListFileData[] = _.pullAll(currentEntries, entriesToRemove);
                return this.writeVDFListData(steamDirectory, userId, mergedEntries);
            }).then(() => resolve()).catch((error) => reject(error));
        });
    }

    removeVDFEntriesAndImages(previewData?: PreviewData) {
        let promises: Promise<void>[] = [];
        for (let steamDirectory in this.listData) {
            for (let userId in this.listData[steamDirectory]) {
                promises.push(this.removeEntriesAndImages(steamDirectory, userId, previewData ? previewData[steamDirectory][userId].apps : undefined));
            }
        }

        return Promise.all(promises).catch((error) => {
            throw new Error(this.lang.error.couldNotRemoveEntries__i.interpolate({ error: error }));
        });
    }

    getAllShortcutsData() {
        let dataObject: SteamShortcutsData = { tree: {}, numberOfUsers: 0 };

        for (let steamDirectory in this.listData) {
            dataObject.tree[steamDirectory] = {};
            for (let userId in this.listData[steamDirectory]) {
                dataObject.tree[steamDirectory][userId] = {};

                let data = this.listData[steamDirectory][userId].shortcuts.data['shortcuts'];
                for (let i = 0; i < data.length; i++) {
                    let appName = data[i].appname || data[i].AppName;
                    let exe = data[i].exe;

                    if (dataObject.tree[steamDirectory][userId][generateAppId(exe, appName)] === undefined) {
                        dataObject.numberOfUsers++;
                        dataObject.tree[steamDirectory][userId][generateAppId(exe, appName)] = data[i];
                    }
                }
            }
        }

        return dataObject;
    }
}