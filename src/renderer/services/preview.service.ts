import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParsersService } from './parsers.service';
import { LoggerService } from './logger.service';
import { PreviewData, ImageContent, ParsedUserConfiguration, Images, PreviewStateVariables, LoadStatus, PreferedImages, ImagesStatusAndContent, ImageProviderData } from '../models';
import { Reference, ImageProvider, VdfManager } from "../lib";
import { union, without } from "lodash";
import * as fs from 'fs-extra';
import * as paths from '../../shared/paths';

@Injectable()
export class PreviewService {
    private imageProvider: ImageProvider;
    private preferedImages: PreferedImages;
    private previewData: BehaviorSubject<PreviewData>;
    private stateVariables: PreviewStateVariables;
    private previewDataChanged: Subject<boolean>;
    private images: Images;
    private allEditedSteamDirectories: string[];
    private steamDirectories: string[];

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private http: Http) {
        this.previewData = new BehaviorSubject<PreviewData>(undefined);
        this.stateVariables = {
            imageUrlsAreDownloading: false,
            listIsBeingSaved: false,
            listIsUpdating: false,
            skipDownloading: false,
            listIsBeingRemoved: false,
            greedySearch: false,
            numberOfListItems: 0,
            numberOfEditedSteamDirectories: 0
        };
        this.previewDataChanged = new Subject<boolean>();
        this.imageProvider = new ImageProvider(this.http);
        this.readPreferedImages().then((data) => this.preferedImages = data).catch((error) => {
            this.loggerService.error('Error occurred while reading prefered image list.', { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true });
            this.loggerService.error(error);
        });
        this.readAllEditedSteamDirectories().then((data) => { 
            this.allEditedSteamDirectories = data;
            this.stateVariables.numberOfEditedSteamDirectories = data.length;
            this.previewDataChanged.next();
        }).catch((error) => {
            this.loggerService.error('Error occurred while reading a list of all edited Steam directories.', { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true });
            this.loggerService.error(error);
        });
    }

    getPreviewData() {
        return this.previewData;
    }

    getPreviewDataChange() {
        return this.previewDataChanged;
    }

    getStateVariables() {
        return this.stateVariables;
    }

    generatePreviewData() {
        if (this.stateVariables.listIsUpdating)
            return this.loggerService.info('List is already updating. Please wait.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingSaved)
            return this.loggerService.info('Files are being saved. Please wait.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingRemoved)
            return this.loggerService.info('Removing files. Please wait.', { invokeAlert: true, alertTimeout: 3000 });

        this.stateVariables.listIsUpdating = true;
        this.imageProvider.stopUrlDownload();
        this.generatePreviewDataCallback();
    }

    saveData() {
        if (this.stateVariables.imageUrlsAreDownloading)
            return this.loggerService.info('Please wait until image urls are downloaded.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingSaved)
            return this.loggerService.info('List is already being saved.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.numberOfListItems === 0)
            return this.loggerService.info('List is empty.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingRemoved)
            return this.loggerService.info('Removing files. Please wait.', { invokeAlert: true, alertTimeout: 3000 });


        this.stateVariables.listIsBeingSaved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info('Populating VDF list.', { invokeAlert: true, alertTimeout: 3000 });
        vdfManager.populateList(this.steamDirectories).then((errors) => {
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
            this.loggerService.info('Merging VDF entries and replacing image files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.mergeVDFEntriesAndReplaceImages(this.previewData.getValue());
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while merging VDF files or downloading images.');
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info('Writing VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success('Saving a list of preffered images.', { invokeAlert: true, alertTimeout: 3000 });
            this.updatePreferedImages();
        }).then(() => {
            this.loggerService.success('Updating a list of edited Steam directories.', { invokeAlert: true, alertTimeout: 3000 });
            this.updateEditedSteamDirectories(this.steamDirectories, false);
        }).then(() => {
            this.loggerService.success('New entries saved/added.', { invokeAlert: true, alertTimeout: 3000 });
            this.stateVariables.listIsBeingSaved = false;
        }).catch((fatalError) => {
            this.loggerService.error('Fatal error occurred while saving parsed list. See event log for details.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.stateVariables.listIsBeingSaved = false;
        });
    }

    remove(all: boolean) {
        if (this.stateVariables.imageUrlsAreDownloading) {
            this.imageProvider.stopUrlDownload();
            return this.loggerService.info('Aborting image url donwload. Please try again once it\'s stopped.', { invokeAlert: true, alertTimeout: 3000 });
        }
        else if (this.stateVariables.listIsBeingSaved)
            return this.loggerService.info('Can\'t remove while list is being saved.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.numberOfListItems === 0 && !all)
            return this.loggerService.info('List is empty.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingRemoved)
            return this.loggerService.info('Already removing files.', { invokeAlert: true, alertTimeout: 3000 });
        else if (all && this.allEditedSteamDirectories.length === 0)
            return this.loggerService.info('A list of edited Steam directories is empty.', { invokeAlert: true, alertTimeout: 3000 });

        this.stateVariables.listIsBeingRemoved = true;

        let vdfManager = new VdfManager(this.http);
        this.loggerService.info('Populating VDF list.', { invokeAlert: true, alertTimeout: 3000 });
        vdfManager.populateList(all ? this.allEditedSteamDirectories : this.steamDirectories).then((errors) => {
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
            return vdfManager.removeVDFEntriesAndImages(all ? undefined : this.previewData.getValue());
        }).then(() => {
            this.loggerService.info('Writing VDF files.', { invokeAlert: true, alertTimeout: 3000 });
            return vdfManager.writeAllVDFs();
        }).then(() => {
            this.loggerService.success('Updating a list of edited Steam directories.', { invokeAlert: true, alertTimeout: 3000 });
            this.updateEditedSteamDirectories(this.allEditedSteamDirectories, true);
        }).then(() => {
            this.loggerService.success('Entries have been removed.', { invokeAlert: true, alertTimeout: 3000 });
            this.stateVariables.listIsBeingRemoved = false;
        }).catch((fatalError) => {
            this.loggerService.error('Fatal error occurred while removing list. See event log for details.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.stateVariables.listIsBeingRemoved = false;
        });
    }

    loadImage(title: string, index: number) {
        let previewData = this.previewData.getValue();
        if (previewData[title]) {
            let images = previewData[title].images.value.content;
            if (images.length) {
                if (images[index].loadStatus === 'none' || images[index].loadStatus === 'failed') {
                    if (images[index].loadStatus === 'failed') {
                        this.loggerService.error(`Retrying to download "${images[index].imageUrl}" for (${title})`);
                    }

                    images[index].loadStatus = 'downloading';
                    this.previewDataChanged.next();
                    let imageLoader = new Image();
                    imageLoader.onload = () => {
                        images[index].loadStatus = 'downloaded';
                        this.previewDataChanged.next();
                    };
                    imageLoader.onerror = () => {
                        this.loggerService.error(`"${images[index].imageUrl}" failed to download for (${title})`);
                        images[index].loadStatus = 'failed';
                        this.previewDataChanged.next();
                    };
                    imageLoader.src = images[index].imageUrl;
                }
            }
        }
    }

    setImageIndex(title: string, index: number) {
        let previewData = this.previewData.getValue();
        if (previewData[title]) {
            let images = previewData[title].images.value.content;
            if (images.length) {
                previewData[title].currentImageIndex = index < 0 ? images.length - 1 : (index < images.length ? index : 0);
                this.previewDataChanged.next();
            }
        }
    }

    private readPreferedImages() {
        return new Promise<PreferedImages>((resolve, reject) => {
            fs.readFile(paths.preferedImages, 'utf8', (error, data) => {
                try {
                    if (error) {
                        if (error.code !== 'ENOENT')
                            reject(error);
                        else
                            resolve({});
                    }
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    private updatePreferedImages() {
        return new Promise<PreferedImages>((resolve, reject) => {
            let list: PreferedImages = {};
            let previewData = this.previewData.getValue();
            for (let title in previewData) {
                if (previewData[title].images.value.content.length)
                    list[title] = previewData[title].images.value.content[previewData[title].currentImageIndex].imageUrl;
            }
            this.preferedImages = list;
            fs.outputFile(paths.preferedImages, JSON.stringify(list, null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    private readAllEditedSteamDirectories() {
        return new Promise<string[]>((resolve, reject) => {
            fs.readFile(paths.allEditedSteamDirectories, 'utf8', (error, data) => {
                try {
                    if (error) {
                        if (error.code !== 'ENOENT')
                            reject(error);
                        else
                            resolve([]);
                    }
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    private updateEditedSteamDirectories(directories: string[], remove: boolean) {
        return new Promise<PreferedImages>((resolve, reject) => {
            let newDirectories: string[] = this.allEditedSteamDirectories || [];

            for (let i = 0; i < directories.length; i++) {
                let index = this.allEditedSteamDirectories.indexOf(directories[i]);
                if (remove) {
                    if (index !== -1) {
                        newDirectories[index] = undefined;
                    }
                }
                else {
                    if (index === -1) {
                        this.allEditedSteamDirectories.push(directories[i]);
                    }
                }
            }

            this.allEditedSteamDirectories = without(newDirectories, undefined);
            this.stateVariables.numberOfEditedSteamDirectories = this.allEditedSteamDirectories.length;
            this.previewDataChanged.next();
            fs.outputFile(paths.allEditedSteamDirectories, JSON.stringify(this.allEditedSteamDirectories, null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    private generatePreviewDataCallback() {
        if (this.stateVariables.imageUrlsAreDownloading) {
            setTimeout(this.generatePreviewDataCallback.bind(this), 100);
        }
        else {
            this.previewData.next(undefined);
            this.loggerService.info('Executing parsers.', { invokeAlert: true });
            this.parsersService.executeFileParser().then((data) => {
                if (data.parsedData.length > 0) {
                    this.loggerService.info('Please shutdown Steam if it is running when saving, otherwise it might not save correctly.', { invokeAlert: true, alertTimeout: 5000 });

                    this.steamDirectories = this.getAllSteamDirectories(data.parsedData);
                    this.images = {};

                    let previewData: { numberOfItems: number, data: PreviewData } = this.createPreviewData(data.parsedData);

                    if (previewData.numberOfItems > 0) {
                        this.previewData.next(previewData.data);
                        if (!this.stateVariables.skipDownloading)
                            this.downloadImageUrls();
                    }
                    else {
                        this.previewData.next(undefined);
                    }
                    this.stateVariables.numberOfListItems = previewData.numberOfItems;
                }
                else if (data.invalid.length === 0 && data.skipped.length === 0) {
                    if (this.parsersService.getUserConfigurationsArray().length === 0)
                        this.loggerService.info('Please create parser configuration in "Parsers" menu first.', { invokeAlert: true });
                    else
                        this.loggerService.info('Parser(-s) found no files matching user configuration.', { invokeAlert: true });

                    this.stateVariables.numberOfListItems = 0;
                }

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

                this.stateVariables.listIsUpdating = false;
            }).catch((error) => {
                this.loggerService.error('Error occurred while parsing configurations. See event log for details.', { invokeAlert: true, doNotAppendToLog: true });
                this.loggerService.error('Error occurred while parsing configurations:');
                this.loggerService.error(error);
                this.stateVariables.listIsUpdating = false;
            });
        }
    }

    private getAllSteamDirectories(data: ParsedUserConfiguration[]) {
        let title: string[] = [];
        for (let i = 0; i < data.length; i++) {
            if (title.indexOf(data[i].steamDirectory) === -1)
                title.push(data[i].steamDirectory);
        }
        return title;
    }

    private createPreviewData(data: ParsedUserConfiguration[]) {
        let numberOfItems: number = 0;
        let previewData: PreviewData = {};
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].files.length; j++) {
                if (previewData[data[i].files[j].fuzzyFinalTitle] === undefined) {
                    previewData[data[i].files[j].fuzzyFinalTitle] = {
                        steamDirectories: {
                            [data[i].steamDirectory]: {
                                steamCategories: data[i].steamCategories,
                                executableLocation: data[i].executableLocation,
                                argumentString: data[i].files[j].argumentString,
                            }
                        },
                        currentImageIndex: 0,
                        images: new Reference<ImagesStatusAndContent>(this.images, data[i].files[j].fuzzyTitle)
                    };
                    numberOfItems++;
                }
                else {
                    if (previewData[data[i].files[j].fuzzyFinalTitle].steamDirectories[data[i].steamDirectory] === undefined)
                        previewData[data[i].files[j].fuzzyFinalTitle].steamDirectories[data[i].steamDirectory] = {
                            steamCategories: data[i].steamCategories,
                            executableLocation: data[i].executableLocation,
                            argumentString: data[i].files[j].argumentString,
                        };
                    else {
                        let currentCategories = previewData[data[i].files[j].fuzzyFinalTitle].steamDirectories[data[i].steamDirectory].steamCategories;
                        previewData[data[i].files[j].fuzzyFinalTitle].steamDirectories[data[i].steamDirectory].steamCategories = union(currentCategories, data[i].steamCategories);
                    }
                }

                if (this.images[data[i].files[j].fuzzyTitle] === undefined)
                    this.images[data[i].files[j].fuzzyTitle] = { status: this.stateVariables.skipDownloading ? 'retrieved' : 'none', searchTitles: [data[i].files[j].fuzzyTitle], content: [] };

                if (this.stateVariables.greedySearch) {
                    if (this.images[data[i].files[j].fuzzyTitle].searchTitles.indexOf(data[i].files[j].extractedTitle) === -1)
                        this.images[data[i].files[j].fuzzyTitle].searchTitles.push(data[i].files[j].extractedTitle);
                }

                if (data[i].files[j].localImages.length) {
                    for (let k = 0; k < data[i].files[j].localImages.length; k++) {
                        this.addUniqueImage(data[i].files[j].fuzzyTitle, { imageProvider: 'LocalStorage', imageUrl: data[i].files[j].localImages[k], loadStatus: 'downloaded' })
                    }
                }
            }
        }
        return { numberOfItems: numberOfItems, data: previewData };
    }

    private addUniqueImage(title: string, ...content: ImageContent[]) {
        for (let i = 0; i < content.length; i++) {
            if (this.images[title].content.findIndex((item) => item.imageUrl === content[i].imageUrl) === -1)
                this.images[title].content.push(content[i]);
        }
    }

    private downloadImageUrls(...imageProviders: string[]) {
        if (!this.stateVariables.imageUrlsAreDownloading) {
            this.stateVariables.imageUrlsAreDownloading = true;
            let previewData = this.previewData.getValue();
            let promises: Promise<any>[] = [];
            for (let fuzzyTitle in this.images) {
                this.images[fuzzyTitle].status = 'retrieving';
                promises.push(new Promise((resolve, reject) => {
                    let searchPromises: Promise<ImageProviderData>[] = [];
                    for (let i = 0; i < this.images[fuzzyTitle].searchTitles.length; i++) {
                        searchPromises.push(this.imageProvider.retrieveUrls(this.images[fuzzyTitle].searchTitles[i], ...imageProviders)/*.then((data) => {
                            return Promise.resolve(data);
                        })*/);
                    }
                    Promise.all(searchPromises).then((dataArray) => {
                        let data: ImageProviderData = { failed: [], images: [] };

                        for (let j = 0; j < dataArray.length; j++) {
                            data.failed = data.failed.concat(dataArray[j].failed);
                            data.images = data.images.concat(dataArray[j].images);
                        }

                        if (data.failed.length) {
                            this.loggerService.error(`Failed to retrieve some image urls for "${fuzzyTitle}"`, { invokeAlert: true, alertTimeout: 3000 });
                            for (let i = 0; i < data.failed.length; i++) {
                                this.loggerService.error(data.failed[i]);
                            }
                        }

                        this.addUniqueImage(fuzzyTitle, ...data.images);

                        if (this.preferedImages !== undefined) {
                            for (let title in this.preferedImages) {
                                let index = this.images[fuzzyTitle].content.findIndex((image) => this.preferedImages[title] === image.imageUrl);
                                if (index !== -1 && previewData[title] !== undefined)
                                    previewData[title].currentImageIndex = index;
                            }
                        }

                        this.images[fuzzyTitle].status = 'retrieved';
                        this.previewDataChanged.next();

                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                }));
            }
            Promise.all(promises).then(() => {
                this.stateVariables.imageUrlsAreDownloading = false;
            }).catch(() => {
                this.stateVariables.imageUrlsAreDownloading = false;
            });
        }
    }
}