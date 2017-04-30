import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParsersService } from './parsers.service';
import { LoggerService } from './logger.service';
import { PreviewData, ImageContent, ParsedUserConfiguration, Images, PreviewStateVariables, LoadStatus, PreferedImages, ImagesStatusAndContent } from '../models';
import { VDFList, Reference, ImageProvider } from "../lib";
import { union } from "lodash";
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
    private steamDirectories: string[];

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private http: Http) {
        this.previewData = new BehaviorSubject<PreviewData>(undefined);
        this.stateVariables = {
            imageUrlsAreDownloading: false,
            listIsBeingSaved: false,
            listIsUpdating: false,
            numberOfListItems: 0
        };
        this.previewDataChanged = new Subject<boolean>();
        this.imageProvider = new ImageProvider(this.http);
        this.readPreferedImages();
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

        this.stateVariables.listIsUpdating = true;
        this.imageProvider.stopUrlDownload();
        this.generatePreviewDataCallback();
    }

    saveData() {
        if (this.stateVariables.imageUrlsAreDownloading)
            return this.loggerService.info('Please wait until image urls are downloaded.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.listIsBeingSaved)
            return this.loggerService.info('Please wait until list is saved to save again.', { invokeAlert: true, alertTimeout: 3000 });
        else if (this.stateVariables.numberOfListItems === 0)
            return this.loggerService.info('List is empty.', { invokeAlert: true, alertTimeout: 3000 });


        this.stateVariables.listIsBeingSaved = true;

        let vdfList = new VDFList(this.http);
        this.loggerService.info('Checking if Steam is running.', { invokeAlert: true, alertTimeout: 3000 });
        this.isSteamRunning().then((isRunning) => {
            if (isRunning) {
                throw new Error("Steam is running. Shut it down before saving list!");
            }
            else {
                this.loggerService.info('Retrieving information from steam files.', { invokeAlert: true, alertTimeout: 3000 });
                return vdfList.populateList(this.steamDirectories);
            }
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while reading VDF files.', { invokeAlert: true, alertTimeout: 3000 });
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info('Removing matching entries', { invokeAlert: (errors && errors.length === 0), alertTimeout: 3000 });
            return vdfList.removeEntriesAndImages(this.previewData.getValue());
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while removing entries in VDF files.', { invokeAlert: true, alertTimeout: 3000 });
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.info('Adding new entries and downloading images.', { invokeAlert: (errors && errors.length === 0), alertTimeout: 3000 });
            return vdfList.saveEntriesAndImages(this.previewData.getValue());
        }).then((errors) => {
            if (errors && errors.length) {
                this.loggerService.error('Error(s) occurred while saving new list.', { invokeAlert: true, alertTimeout: 3000 });
                for (let i = 0; i < errors.length; i++)
                    this.loggerService.error(errors[i]);
            }
            this.loggerService.success('New entries saved.', { invokeAlert: (errors && errors.length === 0), alertTimeout: 3000 });
            this.updatePreferedImages();
            this.stateVariables.listIsBeingSaved = false;
        }).catch((fatalError) => {
            this.loggerService.error('Fatal error occurred while saving parsed list. See event log for details.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(fatalError);
            this.stateVariables.listIsBeingSaved = false;
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

    private isSteamRunning() {
        return new Promise<boolean>((resolve, reject) => {
            let ps = require('ps-node');

            ps.lookup({ command: 'steam' }, (error: string, resultList: any[]) => {
                if (error) {
                    reject(error);
                }
                else {
                    for (let i = 0; i < resultList.length; i++) {
                        if (resultList[i].command !== undefined) {
                            if ((<string>resultList[i].command).search(/steam\./i) !== -1)
                                return resolve(true);
                        }
                    }
                    resolve(false);
                }
            });
        });
    }

    private readPreferedImages() {
        fs.readFile(paths.preferedImages, 'utf8', (error, data) => {
            try {
                if (error) {
                    if (error.code !== 'ENOENT')
                        throw error.message;
                }
                else if (this.preferedImages === undefined)
                    this.preferedImages = JSON.parse(data);
            } catch (error) {
                this.loggerService.error('Error occurred while reading prefered image list.', { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true });
                this.loggerService.error(error);
            }
        });
    }

    private updatePreferedImages() {
        let list: PreferedImages = {};
        let previewData = this.previewData.getValue();
        for (let title in previewData) {
            if (previewData[title].images.value.content.length)
                list[title] = previewData[title].images.value.content[previewData[title].currentImageIndex].imageUrl;
        }
        this.preferedImages = list;
        fs.outputFile(paths.preferedImages, JSON.stringify(list, null, 4), (error) => {
            if (error) {
                this.loggerService.error('Error occurred while saving prefered image list.', { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true });
                this.loggerService.error(error.message);
            }
        });
    }

    private generatePreviewDataCallback() {
        if (this.stateVariables.imageUrlsAreDownloading) {
            setTimeout(this.generatePreviewDataCallback.bind(this), 100);
        }
        else {
            this.previewData.next(undefined);
            this.parsersService.executeFileParser().then((data) => {
                if (data.parsedData.length > 0) {
                    let titles = this.getAllTitles(data.parsedData);
                    this.steamDirectories = this.getAllSteamDirectories(data.parsedData);
                    this.images = {};

                    for (let i = 0; i < titles.length; i++)
                        this.images[titles[i]] = { status: 'none', content: [] };

                    let previewData: { numberOfItems: number, data: PreviewData } = this.createPreviewData(data.parsedData);

                    if (previewData.numberOfItems > 0) {
                        this.previewData.next(previewData.data);
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

    private getAllTitles(data: ParsedUserConfiguration[]) {
        let title: string[] = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].files.length; j++) {
                if (title.indexOf(data[i].files[j].fuzzyTitle) === -1)
                    title.push(data[i].files[j].fuzzyTitle);
            }
        }
        return title;
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
                promises.push(this.imageProvider.retrieveUrls(fuzzyTitle, ...imageProviders).then((data) => {
                    
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