import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParsersService } from './parsers.service';
import { LoggerService } from './logger.service';
import { SettingsService } from './settings.service';
import { ImageProviderService } from './image-provider.service';
import {
    PreviewData, ImageContent, ParsedUserConfiguration, AppImages, PreviewVariables,
    ImagesStatusAndContent, ProviderCallbackEventMap, PreviewDataApp, AppSettings,
    SteamGridImageData, SteamShortcutsData, SteamTree, SteamTreeData, SteamShortcuts,
    userAccountData
} from '../models';
import { VdfManager, generateAppId, getMultipleAvailableLogins } from "../lib";
import { gApp } from "../app.global";
import { queue } from 'async';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";

@Injectable()
export class PreviewService {
    private appSettings: AppSettings;
    private previewData: PreviewData;
    private previewVariables: PreviewVariables;
    private previewDataChanged: Subject<boolean>;
    private appImages: AppImages;
    private allEditedSteamDirectories: string[];

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private imageProviderService: ImageProviderService, private settingsService: SettingsService, private http: Http) {
        this.previewData = undefined;
        this.previewVariables = {
            listIsBeingSaved: false,
            listIsBeingGenerated: false,
            listIsBeingRemoved: false,
            numberOfQueriedImages: 0,
            numberOfListItems: 0
        };
        this.previewDataChanged = new Subject<boolean>();
        this.settingsService.onLoad((appSettings: AppSettings) => {
            this.appSettings = appSettings;
        });
        this.appImages = {};
        this.imageProviderService.instance.stopEvent.subscribe(() => {
            for (let imageKey in this.appImages) {
                this.appImages[imageKey].retrieving = false;
            }

            this.previewVariables.numberOfQueriedImages = 0;
            this.loggerService.info(this.lang.info.allImagesRetrieved, { invokeAlert: true, alertTimeout: 3000 });
            this.previewDataChanged.next();
        });
    }

    get lang() {
        return gApp.lang.preview.service;
    }

    getPreviewData() {
        return this.previewData;
    }

    getPreviewDataChange() {
        return this.previewDataChanged;
    }

    getPreviewVariables() {
        return this.previewVariables;
    }

    generatePreviewData(fromSteam: boolean) {
        if (this.previewVariables.listIsBeingGenerated)
            return this.loggerService.info(this.lang.info.listIsBeingGenerated, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 });

        this.previewVariables.listIsBeingGenerated = true;
        this.imageProviderService.instance.stopUrlDownload();
        if (fromSteam) {
            if (this.appSettings.knownSteamDirectories.length === 0) {
                this.previewVariables.listIsBeingGenerated = false;
                this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 });
            }
            else
                this.generatePreviewDataFromSteamCallback();
        }
        else
            this.generatePreviewDataCallback();
    }

    saveData() {
        if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.numberOfListItems === 0)
            return this.loggerService.info(this.lang.info.listIsEmpty, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 });


        this.previewVariables.listIsBeingSaved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
        vdfManager.populateListFromPreviewData(this.previewData).then(() => {
            this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.createBackups();
        }).then(() => {
            this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.readAllVDFs();
        }).then(() => {
            this.loggerService.info(this.lang.info.mergingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.mergeVDFEntriesAndReplaceImages(this.previewData, this.appImages);
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error(this.lang.errors.mergingVDF_entries);
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info(this.lang.info.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success(this.lang.info.updatingKnownSteamDirList, { invokeAlert: true, alertTimeout: 3000 });
            let settings = this.settingsService.getSettings();
            settings.knownSteamDirectories = _.union(settings.knownSteamDirectories, Object.keys(this.previewData));
            this.settingsService.settingsChanged();
        }).then(() => {
            this.loggerService.success(this.lang.success.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            this.previewVariables.listIsBeingSaved = false;
        }).catch((fatalError) => {
            this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.previewVariables.listIsBeingSaved = false;
        });
    }

    remove(all: boolean) {
        if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.numberOfListItems === 0 && !all)
            return this.loggerService.info(this.lang.info.listIsEmpty, { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 });
        else if (all && this.appSettings.knownSteamDirectories.length === 0)
            return this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 });

        this.imageProviderService.instance.stopUrlDownload();
        this.previewDataChanged.next();
        this.previewVariables.listIsBeingRemoved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
        Promise.resolve().then(() => {
            if (all)
                return vdfManager.populateListFromDirectoryList(this.appSettings.knownSteamDirectories);
            else
                return vdfManager.populateListFromPreviewData(this.previewData).then(() => { return []; });
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error(this.lang.errors.readingVDF_entries);
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.createBackups();
        }).then(() => {
            this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.readAllVDFs();
        }).then(() => {
            this.loggerService.info(this.lang.info.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.removeVDFEntriesAndImages(all ? undefined : this.previewData);
        }).then((errors) => {
            this.loggerService.info(this.lang.info.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success(this.lang.success.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
            this.previewVariables.listIsBeingRemoved = false;
            this.clearPreviewData();
        }).catch((fatalError) => {
            this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.previewVariables.listIsBeingRemoved = false;
        });
    }

    loadImage(app: PreviewDataApp) {
        if (app) {
            let image = this.appImages[app.imagePool].content[app.currentImageIndex];
            if (image && (image.loadStatus === 'notStarted' || image.loadStatus === 'failed')) {
                if (image.loadStatus === 'failed') {
                    this.loggerService.info(this.lang.info.retryingDownload__i.interpolate({
                        imageUrl: image.imageUrl,
                        appTitle: app.title
                    }));
                }

                image.loadStatus = 'downloading';
                this.previewDataChanged.next();

                let imageLoader = new Image();
                imageLoader.onload = () => {
                    image.loadStatus = 'done';
                    this.previewDataChanged.next();
                };
                imageLoader.onerror = () => {
                    this.loggerService.error(this.lang.errors.retryingDownload__i.interpolate({
                        imageUrl: image.imageUrl,
                        appTitle: app.title
                    }));
                    image.loadStatus = 'failed';
                    this.previewDataChanged.next();
                };
                imageLoader.src = image.imageUrl;
            }
        }
    }

    preloadImages() {
        for (let imageKey in this.appImages) {
            for (let i = 0; i < this.appImages[imageKey].content.length; i++) {
                this.preloadImage(this.appImages[imageKey].content[i]);
            }
        }
    }

    preloadImage(image: ImageContent) {
        if (image && image.loadStatus === 'notStarted' || image.loadStatus === 'failed') {
            image.loadStatus = 'downloading';
            this.previewDataChanged.next();

            let imageLoader = new Image();
            imageLoader.onload = () => {
                image.loadStatus = 'done';
                this.previewDataChanged.next();
            };
            imageLoader.onerror = () => {
                image.loadStatus = 'failed';
                this.previewDataChanged.next();
            };
            imageLoader.src = image.imageUrl;
        }
    }

    setImageIndex(app: PreviewDataApp, index: number) {
        if (app) {
            let images = this.appImages[app.imagePool].content;
            if (images.length) {
                let minIndex = app.steamImage ? -1 : 0;
                app.currentImageIndex = index < minIndex ? images.length - 1 : (index < images.length ? index : minIndex);
                this.previewDataChanged.next();
            }
        }
    }

    setIconIndex(app: PreviewDataApp, index: number) {
        if (app && app.icons.length) {
            app.currentIconIndex = index < 0 ? app.icons.length - 1 : (index < app.icons.length ? index : 0);
            this.previewDataChanged.next();
        }
    }

    get images(){
        return this.appImages;
    }

    private clearPreviewData(){
        this.previewData = undefined;
        this.clearImageCacheSettings();
        this.previewVariables.numberOfListItems = 0;
        this.previewDataChanged.next();
    }

    private clearImageCacheSettings(){
        for (let imageKey in this.appImages) {
            this.appImages[imageKey].defaultImageProviders = [];
            this.appImages[imageKey].searchQueries = [];
            this.appImages[imageKey].retrieving = false;
        }
    }

    private generatePreviewDataCallback() {
        if (this.previewVariables.numberOfQueriedImages !== 0) {
            setTimeout(this.generatePreviewDataCallback.bind(this), 100);
        }
        else {
            this.previewData = undefined;
            this.loggerService.info(this.lang.info.executingParsers, { invokeAlert: true });
            this.parsersService.executeFileParser().then((data) => {
                if (data.skipped.length > 0) {
                    this.loggerService.info(this.lang.info.disabledConfigurations__i.interpolate({
                        count: data.skipped.length
                    }), { invokeAlert: true, alertTimeout: 3000 });
                    for (let i = 0; i < data.skipped.length; i++) {
                        this.loggerService.info(data.skipped[i]);
                    }
                }

                if (data.invalid.length > 0) {
                    this.loggerService.info(this.lang.info.invalidConfigurations__i.interpolate({
                        count: data.invalid.length
                    }), { invokeAlert: true, alertTimeout: 3000 });
                    for (let i = 0; i < data.invalid.length; i++) {
                        this.loggerService.info(data.invalid[i]);
                    }
                }

                if (data.parsedData.parsedConfigs.length > 0) {
                    if (data.parsedData.noUserAccounts) {
                        this.loggerService.info(this.lang.info.noAccountsWarning, { invokeAlert: true, alertTimeout: 3000 });
                    }
                    else {
                        this.loggerService.info(this.lang.info.shutdownSteam, { invokeAlert: true, alertTimeout: 3000 });
                        return this.createPreviewData(data.parsedData.parsedConfigs);
                    }
                }
                else if (data.invalid.length === 0 && data.skipped.length === 0) {
                    if (this.parsersService.getUserConfigurationsArray().length === 0)
                        this.loggerService.info(this.lang.info.noParserConfigurations, { invokeAlert: true, alertTimeout: 3000 });
                    else
                        this.loggerService.info(this.lang.info.parserFoundNoFiles, { invokeAlert: true, alertTimeout: 3000 });
                }
            }).then((previewData) => {
                if (previewData && previewData.numberOfItems > 0) {
                    this.previewData = previewData.data;
                    this.previewVariables.numberOfListItems = previewData.numberOfItems;
                    this.downloadImageUrls();
                }
                else {
                    this.previewVariables.numberOfListItems = 0;
                }

                this.previewVariables.listIsBeingGenerated = false;
                this.previewDataChanged.next();
            }).catch((error) => {
                this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
                this.loggerService.error(error);
                this.previewVariables.listIsBeingGenerated = false;
                this.previewDataChanged.next();
            });
        }
    }

    private generatePreviewDataFromSteamCallback() {
        if (this.previewVariables.numberOfQueriedImages !== 0) {
            setTimeout(this.generatePreviewDataFromSteamCallback.bind(this), 100);
        }
        else {
            this.previewData = undefined;

            let vdfManager = new VdfManager(this.http);
            this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
            Promise.resolve().then(() => {
                return vdfManager.populateListFromDirectoryList(this.appSettings.knownSteamDirectories);
            }).then((errors) => {
                if (errors && errors.length) {
                    this.loggerService.error(this.lang.errors.readingVDF_entries);
                    for (let i = 0; i < errors.length; i++)
                        this.loggerService.error(errors[i]);
                }
                this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });
                return vdfManager.createBackups();
            }).then(() => {
                this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });
                return vdfManager.readAllVDFs();
            }).then(() => {
                return this.shortcutsToPreviewData(vdfManager.getAllShortcutsData());
            }).then(() => {
                this.previewVariables.listIsBeingGenerated = false;
                this.previewDataChanged.next();
            }).catch((error) => {
                this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
                this.loggerService.error(error);
                this.previewVariables.listIsBeingGenerated = false;
                this.previewDataChanged.next();
            });
        }
    }

    private getSteamTreeFromParsedConfig(data: ParsedUserConfiguration[]) : SteamTreeData {
        let numberOfUsers: number = 0;
        let tree: SteamTree = {};

        for (let i = 0; i < data.length; i++) {
            let config = data[i];

            if (tree[config.steamDirectory] === undefined)
                tree[config.steamDirectory] = {};

            for (let j = 0; j < config.foundUserAccounts.length; j++) {
                let userAccount = config.foundUserAccounts[j];

                if (tree[config.steamDirectory][userAccount.accountID] === undefined) {
                    numberOfUsers++;
                    tree[config.steamDirectory][userAccount.accountID] = {};
                }
            }
        }

        return { tree, numberOfUsers };
    }

    private getNonSteamGridData(data: SteamTreeData) {
        return Promise.resolve().then(() => {
            let fileData: SteamGridImageData = _.cloneDeep(data.tree);

            if (data.numberOfUsers === 0)
                return fileData;
            else {
                let promises: Promise<void>[] = [];
                for (let steamDirectory in fileData) {
                    for (let userId in fileData[steamDirectory]) {
                        promises.push(new Promise<void>((innerResolve, innerReject) => {
                            fs.readdir(path.join(steamDirectory, 'userdata', userId, 'config', 'grid'), (error, files) => {
                                if (error) {
                                    if (error.code === 'ENOENT')
                                        innerResolve();
                                    else
                                        innerReject(error);
                                }
                                else {
                                    let extRegex = /png|tga|jpg|jpeg/i;
                                    for (let i = 0; i < files.length; i++) {
                                        let ext = path.extname(files[i]);
                                        let basename = path.basename(files[i], ext);
                                        if (fileData[steamDirectory][userId][basename] === undefined) {
                                            if (extRegex.test(ext))
                                                fileData[steamDirectory][userId][basename] = path.join(steamDirectory, 'userdata', userId, 'config', 'grid', files[i]);
                                        }
                                    }
                                    innerResolve();
                                }
                            });
                        }));
                    }
                }
                return Promise.all(promises).then(() => fileData);
            }
        });
    }

    private getNonSteamShortcutsData(data: SteamTreeData) {
        return Promise.resolve().then(() => {
            if (data.numberOfUsers === 0)
                return data;
            else {
                let vdfManager = new VdfManager(this.http);
                return Promise.resolve().then(() => {
                    return vdfManager.populateListFromPreviewData(data.tree);
                }).then(() => {
                    return vdfManager.readAllVDFs();
                }).then(() => {
                    return vdfManager.getAllShortcutsData();
                })
            }
        });
    }

    private createPreviewData(data: ParsedUserConfiguration[]) {
        let gridData: SteamGridImageData;
        let shortcutsData: SteamShortcuts;
        let steamTreeData = this.getSteamTreeFromParsedConfig(data);

        return Promise.resolve().then(() => {
            if (this.appSettings.previewSettings.retrieveCurrentSteamImages)
                return this.getNonSteamGridData(steamTreeData);
            else
                return steamTreeData.tree;
        }).then((resolvedData) => {
            gridData = resolvedData;
            return this.getNonSteamShortcutsData(steamTreeData);
        }).then((resolvedData) => {
            shortcutsData = resolvedData.tree;

            let numberOfItems: number = 0;
            let previewData: PreviewData = {};

            this.clearImageCacheSettings();

            for (let i = 0; i < data.length; i++) {
                let config = data[i];

                if (previewData[config.steamDirectory] === undefined)
                    previewData[config.steamDirectory] = {};

                for (let j = 0; j < config.foundUserAccounts.length; j++) {
                    let userAccount = config.foundUserAccounts[j];

                    if (previewData[config.steamDirectory][userAccount.accountID] === undefined) {
                        previewData[config.steamDirectory][userAccount.accountID] = {
                            username: userAccount.name,
                            apps: {}
                        };
                    }
                    else if (previewData[config.steamDirectory][userAccount.accountID].username !== userAccount.name){
                        previewData[config.steamDirectory][userAccount.accountID].username = `${previewData[config.steamDirectory][userAccount.accountID].username} | ${userAccount.name}`;
                    }

                    for (let k = 0; k < data[i].files.length; k++) {
                        let file = config.files[k];
                        let executableLocation = config.appendArgsToExecutable ? `"${file.executableLocation}" ${file.argumentString}`: `"${file.executableLocation}"`;
                        let appID = generateAppId(executableLocation, file.finalTitle);

                        if (shortcutsData[config.steamDirectory][userAccount.accountID][appID] !== undefined) {
                            if (shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon'] !== undefined) {
                                if (file.localIcons.indexOf(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']) === -1) {
                                    file.localIcons.unshift(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']);
                                }
                            }
                        }

                        if (this.appImages[file.fuzzyTitle] === undefined) {
                            this.appImages[file.fuzzyTitle] = {
                                retrieving: false,
                                searchQueries: file.onlineImageQueries,
                                defaultImageProviders: config.imageProviders,
                                content: []
                            };
                        }
                        else {
                            let currentQueries = this.appImages[file.fuzzyTitle].searchQueries;
                            let currentProviders = this.appImages[file.fuzzyTitle].defaultImageProviders;

                            this.appImages[file.fuzzyTitle].searchQueries = _.union(currentQueries, file.onlineImageQueries);
                            this.appImages[file.fuzzyTitle].defaultImageProviders = _.union(currentProviders, config.imageProviders);
                        }

                        if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
                            let steamImage = gridData[config.steamDirectory][userAccount.accountID][appID];
                            let steamImageUrl = steamImage ? encodeURI(`file:///${steamImage.replace(/\\/g, '/')}`) : undefined;

                            previewData[config.steamDirectory][userAccount.accountID].apps[appID] = {
                                entryId: numberOfItems++,
                                steamCategories: config.steamCategories,
                                startInDirectory: file.startInDirectory,
                                imageProviders: config.imageProviders,
                                argumentString: config.appendArgsToExecutable ? '' : file.argumentString,
                                title: file.finalTitle,
                                steamImage: steamImage ? {
                                    imageProvider: 'Steam',
                                    imageUrl: steamImageUrl,
                                    loadStatus: 'done'
                                } : undefined,
                                currentImageIndex: steamImageUrl ? -1 : 0,
                                executableLocation: executableLocation,
                                currentIconIndex: 0,
                                icons: file.localIcons,
                                imagePool: file.fuzzyTitle
                            };
                        }
                        else {
                            let currentCategories = previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories;
                            previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories = _.union(currentCategories, config.steamCategories);
                        }

                        for (let l = 0; l < file.localImages.length; l++) {
                            this.addUniqueImage(file.fuzzyTitle, {
                                imageProvider: 'LocalStorage',
                                imageUrl: file.localImages[l],
                                loadStatus: 'done'
                            });
                        }
                    }
                }
            }
            return { numberOfItems: numberOfItems, data: previewData };
        });
    }

    private shortcutsToPreviewData(data: SteamShortcutsData) {
        let gridData: SteamGridImageData;
        let availableLogins: { [directory: string]: userAccountData[] };

        return Promise.resolve().then(() => {
            return this.getNonSteamGridData(data);
        }).then((resolvedData) => {
            gridData = resolvedData;
            return getMultipleAvailableLogins(Object.keys(data.tree), true);
        }).then((resolvedData) => {
            //availableLogins = resolvedData;

            this.clearImageCacheSettings();

            availableLogins

            console.log(availableLogins);
        });
    }

    downloadImageUrls(imageKeys?: string[], imageProviders?: string[]) {
        if (!this.appSettings.offlineMode) {
            let allImagesRetrieved = true;
            let imageQueue = queue((task, callback) => callback());

            if (imageKeys === undefined || imageKeys.length === 0) {
                imageKeys = Object.keys(this.appImages);
            }

            for (let i = 0; i < imageKeys.length; i++) {
                let image = this.appImages[imageKeys[i]];
                let imageProvidersForKey: string[] = imageProviders === undefined || imageProviders.length === 0 ? image.defaultImageProviders : imageProviders;

                imageProvidersForKey = _.intersection(this.appSettings.enabledProviders, imageProvidersForKey);

                if (image !== undefined && !image.retrieving) {
                    let numberOfQueriesForImageKey = image.searchQueries.length * imageProvidersForKey.length;

                    if (numberOfQueriesForImageKey > 0) {
                        image.retrieving = true;
                        allImagesRetrieved = false;
                        this.previewVariables.numberOfQueriedImages += numberOfQueriesForImageKey;

                        for (let j = 0; j < image.searchQueries.length; j++) {
                            this.imageProviderService.instance.retrieveUrls(image.searchQueries[j], imageProvidersForKey, <K extends keyof ProviderCallbackEventMap>(event: K, data: ProviderCallbackEventMap[K]) => {
                                switch (event) {
                                    case 'error':
                                        {
                                            let errorData = (data as ProviderCallbackEventMap['error']);
                                            if (typeof errorData.error === 'number') {
                                                this.loggerService.error(this.lang.errors.providerError__i.interpolate({
                                                    provider: errorData.provider,
                                                    code: errorData.error,
                                                    title: errorData.title,
                                                    url: errorData.url
                                                }));
                                            }
                                            else {
                                                this.loggerService.error(this.lang.errors.unknownProviderError__i.interpolate({
                                                    provider: errorData.provider,
                                                    title: errorData.title,
                                                    error: errorData.error
                                                }));
                                            }
                                        }

                                        break;
                                    case 'timeout':
                                        {
                                            let timeoutData = (data as ProviderCallbackEventMap['timeout']);
                                            this.loggerService.info(this.lang.info.providerTimeout__i.interpolate({
                                                time: timeoutData.time,
                                                provider: timeoutData.provider
                                            }), { invokeAlert: true, alertTimeout: 3000 });
                                        }
                                        break;
                                    case 'image':
                                        imageQueue.push(null, () => {
                                            let newImage = this.addUniqueImage(imageKeys[i], (data as ProviderCallbackEventMap['image']).content);
                                            if (newImage !== null && this.appSettings.previewSettings.preload)
                                                this.preloadImage(newImage);

                                            this.previewDataChanged.next();
                                        });
                                        break;
                                    case 'completed':
                                        {
                                            if (--numberOfQueriesForImageKey === 0) {
                                                image.retrieving = false;
                                            }
                                            if (--this.previewVariables.numberOfQueriedImages === 0) {
                                                this.loggerService.info(this.lang.info.allImagesRetrieved, { invokeAlert: true, alertTimeout: 3000 });
                                            }
                                            this.previewDataChanged.next();
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            });
                        }
                    }
                }
            }
            this.previewDataChanged.next();
            if (allImagesRetrieved) {
                this.loggerService.info(this.lang.info.allImagesRetrieved, { invokeAlert: true, alertTimeout: 3000 });
            }
        }
        else
            this.previewDataChanged.next();
    }

    private addUniqueImage(imageKey: string, content: ImageContent) {
        if (this.appImages[imageKey].content.findIndex((item) => item.imageUrl === content.imageUrl) === -1) {
            this.appImages[imageKey].content.push(content);
            return this.appImages[imageKey].content[this.appImages[imageKey].content.length - 1];
        }
        return null;
    }
}