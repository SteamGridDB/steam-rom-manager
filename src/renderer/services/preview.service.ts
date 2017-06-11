import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParsersService } from './parsers.service';
import { LoggerService } from './logger.service';
import { SettingsService } from './settings.service';
import { PreviewData, ImageContent, ParsedUserConfiguration, Images, PreviewVariables, PreferedImages, ImagesStatusAndContent, ProviderEvent, PreviewDataApp, AppSettings, SteamGridImageData } from '../models';
import { Reference, ImageProvider, VdfManager, generateAppId } from "../lib";
import { queue } from 'async';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";

@Injectable()
export class PreviewService {
    private imageProvider: ImageProvider;
    private appSettings: AppSettings;
    private preferedImages: PreferedImages;
    private previewData: PreviewData;
    private previewVariables: PreviewVariables;
    private previewDataChanged: Subject<boolean>;
    private images: Images;
    private allEditedSteamDirectories: string[];

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private settingsService: SettingsService, private http: Http) {
        this.previewData = undefined;
        this.previewVariables = {
            listIsBeingSaved: false,
            listIsUpdating: false,
            listIsBeingRemoved: false,
            numberOfQueriedImages: 0,
            numberOfListItems: 0
        };
        this.previewDataChanged = new Subject<boolean>();
        this.imageProvider = new ImageProvider(this.http, this.loggerService, this.settingsService);
        let settingsLoaded = this.settingsService.getLoadStatusObservable().subscribe((loaded) => {
            if (loaded) {
                this.appSettings = this.settingsService.getSettings();
                settingsLoaded.unsubscribe();
            }
        });
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

    generatePreviewData() {
        if (this.previewVariables.listIsUpdating)
            return this.loggerService.info('List is already updating. Please wait.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info('Files are being saved. Please wait.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info('Removing files. Please wait.', { invokeAlert: true, alertTimeout: 3000 });

        this.previewVariables.listIsUpdating = true;
        this.imageProvider.stopUrlDownload();
        this.generatePreviewDataCallback();
    }

    saveData() {
        if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info('List is already being saved.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.numberOfListItems === 0)
            return this.loggerService.info('List is empty.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info('Removing files. Please wait.', { invokeAlert: true, alertTimeout: 3000 });


        this.previewVariables.listIsBeingSaved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info('Populating VDF list.', { invokeAlert: true, alertTimeout: 3000 });
        vdfManager.populateListFromPreviewData(this.previewData).then(() => {
            this.loggerService.info('Creating backups.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.createBackups();
        }).then(() => {
            this.loggerService.info('Reading VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.readAllVDFs();
        }).then(() => {
            this.loggerService.info('Merging VDF entries and replacing image files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.mergeVDFEntriesAndReplaceImages(this.previewData);
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while merging VDF files or downloading images.');
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info('Writing VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success('Updating a list of known Steam directories.', { invokeAlert: true, alertTimeout: 3000 });
            let settings = this.settingsService.getSettings();
            settings.knownSteamDirectories = _.union(settings.knownSteamDirectories, Object.keys(this.previewData));
            this.settingsService.settingsChanged();
        }).then(() => {
            this.loggerService.success('New entries saved/added.', { invokeAlert: true, alertTimeout: 3000 });
            this.previewVariables.listIsBeingSaved = false;
        }).catch((fatalError) => {
            this.loggerService.error('Fatal error occurred while saving parsed list. See event log for details.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.previewVariables.listIsBeingSaved = false;
        });
    }

    remove(all: boolean) {
        if (this.previewVariables.listIsBeingSaved)
            return this.loggerService.info('Can\'t remove while list is being saved.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.numberOfListItems === 0 && !all)
            return this.loggerService.info('List is empty.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.previewVariables.listIsBeingRemoved)
            return this.loggerService.info('Already removing files.', { invokeAlert: true, alertTimeout: 3000 });
        else if (all && this.appSettings.knownSteamDirectories.length === 0)
            return this.loggerService.info('A list of known Steam directories is empty.', { invokeAlert: true, alertTimeout: 3000 });

        this.imageProvider.stopUrlDownload();
        this.previewVariables.listIsBeingRemoved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info('Populating VDF list.', { invokeAlert: true, alertTimeout: 3000 });
        Promise.resolve().then(() => {
            if (all)
                return vdfManager.populateListFromDirectoryList(this.appSettings.knownSteamDirectories);
            else
                return vdfManager.populateListFromPreviewData(this.previewData).then(() => { return []; });
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while reading VDF files.');
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info('Creating backups.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.createBackups();
        }).then(() => {
            this.loggerService.info('Reading VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.readAllVDFs();
        }).then(() => {
            this.loggerService.info('Removing VDF entries and image files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.removeVDFEntriesAndImages(all ? undefined : this.previewData);
        }).then((errors) => {
            this.loggerService.info('Writing VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success('Entries have been removed.', { invokeAlert: true, alertTimeout: 3000 });
            this.previewVariables.listIsBeingRemoved = false;
        }).catch((fatalError) => {
            this.loggerService.error('Fatal error occurred while removing list. See event log for details.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.previewVariables.listIsBeingRemoved = false;
        });
    }

    loadImage(app: PreviewDataApp) {
        if (app) {
            let image = app.images.value.content[app.currentImageIndex];
            if (image && (image.loadStatus === 'notStarted' || image.loadStatus === 'failed')) {
                if (image.loadStatus === 'failed') {
                    this.loggerService.error(`Retrying to download "${image.imageUrl}" for "${app.title}".`);
                }

                image.loadStatus = 'downloading';
                this.previewDataChanged.next();

                let imageLoader = new Image();
                imageLoader.onload = () => {
                    image.loadStatus = 'done';
                    this.previewDataChanged.next();
                };
                imageLoader.onerror = () => {
                    this.loggerService.error(`"${image.imageUrl}" failed to download for "${app.title}".`);
                    image.loadStatus = 'failed';
                    this.previewDataChanged.next();
                };
                imageLoader.src = image.imageUrl;
            }
        }
    }

    preloadImages() {
        for (let imageKey in this.images) {
            for (let i = 0; i < this.images[imageKey].content.length; i++) {
                this.preloadImage(this.images[imageKey].content[i]);
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
            let images = app.images.value.content;
            if (images.length) {
                let minIndex = app.steamImage ? -1 : 0;
                app.currentImageIndex = index < minIndex ? images.length - 1 : (index < images.length ? index : minIndex);
                this.previewDataChanged.next();
            }
        }
    }

    private generatePreviewDataCallback() {
        if (this.previewVariables.numberOfQueriedImages !== 0) {
            setTimeout(this.generatePreviewDataCallback.bind(this), 100);
        }
        else {
            this.previewData = undefined;
            this.loggerService.info('Executing parsers.', { invokeAlert: true });
            this.parsersService.executeFileParser().then((data) => {
                if (data.skipped.length > 0) {
                    this.loggerService.info(`${data.skipped.length} user configuration(-s) was/were skipped (disabled by user).`, { invokeAlert: true, doNotAppendToLog: true, alertTimeout: 3000 });
                    this.loggerService.info(`${data.skipped.length} user configuration(-s) was/were skipped (disabled by user):`);
                    for (let i = 0; i < data.skipped.length; i++) {
                        this.loggerService.info(data.skipped[i]);
                    }
                }

                if (data.invalid.length > 0) {
                    this.loggerService.info(`${data.invalid.length} user configuration(-s) was/were skipped (invalid).`, { invokeAlert: true, doNotAppendToLog: true, alertTimeout: 3000 });
                    this.loggerService.info(`${data.invalid.length} user configuration(-s) was/were skipped (invalid):`);
                    for (let i = 0; i < data.invalid.length; i++) {
                        this.loggerService.info(data.invalid[i]);
                    }
                }

                if (data.parsedData.length > 0) {
                    this.loggerService.info('Please shutdown Steam if it is running when saving, otherwise it might not save correctly.', { invokeAlert: true, alertTimeout: 5000 });
                    this.images = {};
                    return this.createPreviewData(data.parsedData);
                }
                else if (data.invalid.length === 0 && data.skipped.length === 0) {
                    if (this.parsersService.getUserConfigurationsArray().length === 0)
                        this.loggerService.info('Please create parser configuration in "Parsers" menu first.', { invokeAlert: true });
                    else
                        this.loggerService.info('Parser(-s) found no files matching user configuration.', { invokeAlert: true });
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

                this.previewVariables.listIsUpdating = false;
                this.previewDataChanged.next();
            }).catch((error) => {
                this.loggerService.error('Error occurred while parsing configurations. See event log for details.', { invokeAlert: true, doNotAppendToLog: true });
                this.loggerService.error('Error occurred while parsing configurations:');
                this.loggerService.error(error);
                this.previewVariables.listIsUpdating = false;
                this.previewDataChanged.next();
            });
        }
    }

    private getNonSteamGridData(data: ParsedUserConfiguration[]) {
        return new Promise<SteamGridImageData>((resolve, reject) => {
            let numberOfItems: number = 0;
            let fileData: SteamGridImageData = {};

            for (let i = 0; i < data.length; i++) {
                let config = data[i];

                if (fileData[config.steamDirectory] === undefined)
                    fileData[config.steamDirectory] = {};

                for (let j = 0; j < config.foundUserAccounts.length; j++) {
                    let userAccount = config.foundUserAccounts[j];

                    if (fileData[config.steamDirectory][userAccount.accountID] === undefined) {
                        numberOfItems++;
                        fileData[config.steamDirectory][userAccount.accountID] = {};
                    }
                }
            }

            if (numberOfItems === 0)
                resolve(fileData);
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
                Promise.all(promises).then(() => resolve(fileData)).catch((errors) => reject(errors));
            }
        });
    }

    private createPreviewData(data: ParsedUserConfiguration[]) {
        return Promise.resolve().then(() => {
            return this.getNonSteamGridData(data);
        }).then((gridData) => {
            let numberOfItems: number = 0;
            let previewData: PreviewData = {};

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

                    for (let k = 0; k < data[i].files.length; k++) {
                        let file = config.files[k];
                        let appID = generateAppId(`"${file.executableLocation}"`, file.fuzzyFinalTitle);

                        if (this.images[file.fuzzyTitle] === undefined) {
                            this.images[file.fuzzyTitle] = {
                                retrieving: false,
                                searchQueries: file.onlineImageQueries,
                                content: []
                            };
                        }
                        else {
                            let currentQueries = this.images[file.fuzzyTitle].searchQueries;
                            this.images[file.fuzzyTitle].searchQueries = _.union(currentQueries, file.onlineImageQueries);
                        }

                        if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
                            let steamImage = gridData[config.steamDirectory][userAccount.accountID][appID];
                            let steamImageUrl = steamImage ? encodeURI('file:///' + steamImage.replace(/\\/g, '/')) : undefined;

                            numberOfItems++;
                            previewData[config.steamDirectory][userAccount.accountID].apps[appID] = {
                                steamCategories: config.steamCategories,
                                argumentString: file.argumentString,
                                title: file.fuzzyFinalTitle,
                                steamImage: steamImage ? {
                                    imageProvider: 'Steam',
                                    imageUrl: steamImageUrl,
                                    loadStatus: 'done'
                                } : undefined,
                                currentImageIndex: steamImageUrl ? -1 : 0,
                                executableLocation: file.executableLocation,
                                images: new Reference<ImagesStatusAndContent>(this.images, file.fuzzyTitle)
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

    downloadImageUrls(imageKeys?: string[], imageProviders?: string[]) {
        if (!this.appSettings.offlineMode) {
            let imageQueue = queue((task, callback) => callback());

            if (imageKeys === undefined || imageKeys.length === 0) {
                imageKeys = Object.keys(this.images);
            }

            if (imageProviders === undefined || imageProviders.length === 0) {
                imageProviders = this.imageProvider.getAvailableProviders();
            }

            for (let i = 0; i < imageKeys.length; i++) {
                let image = this.images[imageKeys[i]];

                if (image !== undefined && !image.retrieving) {
                    let numberOfQueriesForImageKey = 0;

                    image.retrieving = true;

                    for (let j = 0; j < image.searchQueries.length; j++) {
                        numberOfQueriesForImageKey = 1 * imageProviders.length;
                        this.previewVariables.numberOfQueriedImages += numberOfQueriesForImageKey;
                        this.imageProvider.retrieveUrls(image.searchQueries[j], imageProviders, (event: ProviderEvent, data: any) => {
                            switch (event) {
                                case ProviderEvent.error:
                                    this.loggerService.error(data);
                                    break;
                                case ProviderEvent.timeout:
                                    this.loggerService.info(data, { invokeAlert: true, alertTimeout: 3000 });
                                    break;
                                case ProviderEvent.success:
                                    imageQueue.push(null, (error) => {
                                        if (error) {
                                            this.loggerService.error(`Error encountered while queing image array. ${error}`);
                                        }
                                        else {
                                            let newImage = this.addUniqueImage(imageKeys[i], data);
                                            if (newImage !== null && this.appSettings.previewSettings.preload)
                                                this.preloadImage(newImage);

                                            this.previewDataChanged.next();
                                        }
                                    });
                                    break;
                                default:
                                    break;
                            }
                        }, (title: string) => {
                            if (--numberOfQueriesForImageKey === 0) {
                                image.retrieving = false;
                                this.previewDataChanged.next();
                            }
                            if (--this.previewVariables.numberOfQueriedImages === 0) {
                                this.loggerService.info(`All available image urls retrieved.`, { invokeAlert: true, alertTimeout: 3000 });
                            }
                        });
                    }
                }
            }
            this.previewDataChanged.next();
        }
        else
            this.previewDataChanged.next();
    }

    private addUniqueImage(imageKey: string, content: ImageContent) {
        if (this.images[imageKey].content.findIndex((item) => item.imageUrl === content.imageUrl) === -1) {
            this.images[imageKey].content.push(content);
            return this.images[imageKey].content[this.images[imageKey].content.length - 1];
        }
        return null;
    }
}