import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { ParsersService } from './parsers.service';
import { LoggerService } from './logger.service';
import { SettingsService } from './settings.service';
import { ImageProviderService } from './image-provider.service';
import { SteamGridDbProvider } from '../../lib/image-providers/steamgriddb.worker';
import {
  PreviewData,
  ImageContent,
  ParsedUserConfiguration,
  AppImages,
  PreviewVariables,
  ImagesStatusAndContent,
  ProviderCallbackEventMap,
  PreviewDataApp,
  AppSettings,
  SteamTree,
  userAccountData,
  VDF_ExtraneousItemsData,
  VDF_AllScreenshotsOutcomes,
  ErrorData, AppSelection,
  AppSelectionImages,
  AppSelectionImage,
  UserConfiguration
} from '../../models';
import {
  VDF_Manager,
  VDF_Error,
  CategoryManager,
  ControllerManager,
  Acceptable_Error
} from "../../lib";
import { APP } from '../../variables';
import { queue } from 'async';
import * as steam from "../../lib/helpers/steam";
import * as url from "../../lib/helpers/url";
import * as unique_ids from "../../lib/helpers/unique-ids";
import * as appImage from "../../lib/helpers/app-image";
import * as ids from '../../lib/helpers/steam';
import { artworkTypes, artworkViewTypes, defaultArtworkType, artworkIdDict, invertedArtworkIdDict } from '../../lib/artwork-types';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as FileSaver from 'file-saver';
import * as path from "path";
import { getMaxLength } from "../../lib/helpers/app-image/get-max-length";
import { OpenDialogReturnValue } from 'electron';
import { dialog } from '@electron/remote';

@Injectable()

export class PreviewService {
  private appSettings: AppSettings;
  private previewData: PreviewData;
  private previewVariables: PreviewVariables;
  private previewDataChanged: Subject<void>;
  private appImages: {[artworkType: string]: AppImages};
  private currentImageType: string;
  private batchProgress: BehaviorSubject<{update: string, batch: number}>;

  constructor(private parsersService: ParsersService, private loggerService: LoggerService, private imageProviderService: ImageProviderService, private settingsService: SettingsService, private http: HttpClient) {
    this.previewData = undefined;
    this.previewVariables = {
      listIsBeingSaved: false,
      listIsBeingGenerated: false,
      listIsBeingRemoved: false,
      listHasGenerated: false,
      numberOfQueriedImages: 0,
      numberOfListItems: 0
    };
    this.previewDataChanged = new Subject<void>();
    this.batchProgress = new BehaviorSubject({update: "", batch: -1})
    this.settingsService.onLoad((appSettings: AppSettings) => {
      this.appSettings = appSettings;
    });
    this.appImages = {};
    for(const artworkType of artworkTypes) {
      this.appImages[artworkType] = {};
    }

    this.currentImageType = defaultArtworkType;
    this.imageProviderService.instance.stopEvent.subscribe(() => {
      for(const artworkType of artworkTypes) {
        for(const imageKey in this.appImages[artworkType]) {
          this.appImages[artworkType][imageKey].retrieving = false;
        }
      }
      this.previewVariables.numberOfQueriedImages = 0;
      this.loggerService.info(this.lang.info.allImagesRetrieved, { invokeAlert: true, alertTimeout: 3000 });
      this.previewDataChanged.next();
    });
  }

  get lang() {
    return APP.lang.preview.service;
  }

  getPreviewData() {
    return this.previewData;
  }

  getPreviewDataChange() {
    return this.previewDataChanged;
  }
  getBatchProgress() {
    return this.batchProgress.asObservable();
  }

  getPreviewVariables() {
    return this.previewVariables;
  }

  getImageType() {
    return this.currentImageType;
  }
  setImageType(imageType: string) {
    this.currentImageType = imageType;
  }

  onLoadUserConfigurations(callback: (userConfigurations: UserConfiguration[]) => void) {
    return this.parsersService.onLoad(callback);
  }

  generatePreviewData() {
    if (this.previewVariables.listIsBeingGenerated)
      return this.loggerService.info(this.lang.info.listIsBeingGenerated, { invokeAlert: true, alertTimeout: 3000 });
    else if (this.previewVariables.listIsBeingSaved)
      return this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 });
    else if (this.previewVariables.listIsBeingRemoved)
      return this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 });

    this.previewVariables.listIsBeingGenerated = true;
    this.imageProviderService.instance.stopUrlDownload();
    this.generatePreviewDataCallback();
  }

  getMatchFixes(title: string) {
    return SteamGridDbProvider.retrievePossibleIds(title)
  }

  updateAppImages(imagePool: string, oldPool: string, artworkType: string) {
    this.appImages[artworkType][imagePool] = {
      retrieving: false,
      searchQueries: [imagePool],
      imageProviderAPIs: this.appImages[artworkType][oldPool].imageProviderAPIs,
      defaultImageProviders: this.appImages[artworkType][oldPool].defaultImageProviders,
      content: this.appImages[artworkType][oldPool].content.filter((imageContent: ImageContent) => {
        return ['LocalStorage'].includes(imageContent.imageProvider)
      })
    }
  }

  saveData({batchWrite, removeAll}: {batchWrite: boolean, removeAll: boolean}): Promise<any> {

    let knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    if (this.previewVariables.listIsBeingSaved) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (!removeAll && this.previewVariables.numberOfListItems === 0) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (this.previewVariables.listIsBeingRemoved) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (removeAll && knownSteamDirectories.length === 0) {
      return Promise.resolve().then(() => { this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }

    let vdfManager = new VDF_Manager();
    let categoryManager = new CategoryManager();
    let controllerManager = new ControllerManager();
    this.previewVariables.listIsBeingSaved = true;

    let extraneousAppIds: VDF_ExtraneousItemsData = undefined;
    let chain: Promise<any> =  Promise.resolve().then(()=>{
      this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.prepare(removeAll ? knownSteamDirectories : this.previewData)
    })
    .then(()=>{
      this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.backup();
    })
    .then(()=>{
      this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.read();
    })
    if(!removeAll) {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.mergingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        return vdfManager.mergeData(this.previewData, this.appImages, this.appSettings.previewSettings.deleteDisabledShortcuts)
      })
    } else {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        return vdfManager.removeAllAddedEntries()
      })
    }
    chain = chain.then((exAppIds: VDF_ExtraneousItemsData) => {
      extraneousAppIds = exAppIds;
    })
    .then(() => {
      this.loggerService.info(this.lang.info.savingCategories)
      return categoryManager.save(this.previewData, extraneousAppIds, removeAll)
    }).catch((error: Acceptable_Error | Error) => {
      if(error instanceof Acceptable_Error) {
        this.loggerService.error(this.lang.errors.categorySaveError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(this.lang.errors.categorySaveError__i.interpolate({error:error.message}));
      } else {
        throw error;
      }
    })
    .then(() => {
      this.loggerService.info(this.lang.info.savingControllers)
      return controllerManager.save(this.previewData, extraneousAppIds, removeAll)
    }).catch((error: Acceptable_Error | Error) => {
      if(error instanceof Acceptable_Error) {
        this.loggerService.error(this.lang.errors.controllerSaveError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(this.lang.errors.controllerSaveError__i.interpolate({error:error.message}));
      } else {
        throw error;
      }
    })
    .then(() => {
      if (removeAll) {
        this.loggerService.info(this.lang.info.removingVDF_entries)
      } else {
        this.loggerService.info(this.lang.info.writingVDF_entries__i.interpolate({ batchSize: 500 }), { invokeAlert: true, alertTimeout: 3000 })
      }
      if (batchWrite) {
        vdfManager.getBatchProgress().subscribe(({update, batch}: {update: string, batch: number})=> {
          console.log("batch", batch, update)
          if(batch > -1) {
            this.loggerService.info(update, {invokeAlert: true, alertTimeout: 3000})
            this.batchProgress.next({update: update, batch: batch})
          }
        })
      }
      return vdfManager.write(batchWrite);
    })
    .then(({nonFatal, outcomes}: {nonFatal: VDF_Error, outcomes: VDF_AllScreenshotsOutcomes})=> {
      if(nonFatal) {
        this.loggerService.error(nonFatal)
      }
      if(batchWrite) {
        this.updatePreviewDataUrls(outcomes)
      }
    })
    .then(() => {
      this.previewVariables.listIsBeingSaved = false;
      if (removeAll) {
        this.loggerService.success(this.lang.success.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        this.clearPreviewData();
      } else {
        this.loggerService.success(this.lang.success.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
      }
      return true;
    }).catch((failureError: Error) => {
      this.previewVariables.listIsBeingSaved = false;
      this.loggerService.error(this.lang.errors.fatalError,{ invokeAlert: true, alertTimeout: 3000 });
      this.loggerService.error(failureError)
      return false;
    })
    return chain;
  }

  private updatePreviewDataUrls(outcomes: VDF_AllScreenshotsOutcomes) {
    for(const steamDirectory in outcomes) {
      for(const userId in outcomes[steamDirectory]) {
        for(const gridName in outcomes[steamDirectory][userId].successes) {
          const shortId = gridName.match(/^\d+/).toString();
          const longId = steam.lengthenAppId(shortId);
          const imageType = invertedArtworkIdDict[gridName.replace(/^\d+/,'')];
          const steamImageUrl = url.encodeFile(outcomes[steamDirectory][userId].successes[gridName]);
          if(this.previewData[steamDirectory][userId].apps[longId]) {
            this.previewData[steamDirectory][userId].apps[longId].images[imageType].steam = {
              imageProvider: 'Steam',
              imageUrl: steamImageUrl,
              imageRes: url.imageDimensions(steamImageUrl),
              loadStatus: 'done'
            }
          }
        }
      }
    }
    this.previewDataChanged.next()
  }

  loadImage(app: PreviewDataApp, imageType?: string) {
    if (app) {
      let image: ImageContent;
      const actualImageType = this.currentImageType === 'games' ? imageType : this.currentImageType;
      image = appImage.getCurrentImage(app.images[actualImageType], this.appImages[actualImageType]);

      if (image !== undefined && (image.loadStatus === 'notStarted' || image.loadStatus === 'failed')) {
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
          let width = imageLoader ? imageLoader.width : 'unknown';
          let height = imageLoader ? imageLoader.height : 'unknown';
          image.imageRes = `${width}x${height}`
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

  preloadImage(image: ImageContent) {
    if (image && image.loadStatus === 'notStarted' || image.loadStatus === 'failed') {
      image.loadStatus = 'downloading';
      this.previewDataChanged.next();

      let imageLoader = new Image();
      imageLoader.onload = () => {
        image.loadStatus = 'done';
        let width = imageLoader ? imageLoader.width : 'unknown';
        let height = imageLoader ? imageLoader.height : 'unknown';
        image.imageRes = `${width}x${height}`
        this.previewDataChanged.next();
      };
      imageLoader.onerror = () => {
        image.loadStatus = 'failed';
        this.previewDataChanged.next();
      };
      imageLoader.src = image.imageUrl;
    }
  }

  preloadImages() {
    for(const artworkType of artworkTypes) {
      for(const imageKey in this.appImages[artworkType]) {
        for (let i = 0; i < this.appImages[artworkType][imageKey].content.length; i++) {
          this.preloadImage(this.appImages[artworkType][imageKey].content[i]);
        }
      }
    }
  }

  setImageIndex(app: PreviewDataApp, index: number, imageType?: string, ignoreCurrentType: boolean = false) {
    if (app) {
      if (!ignoreCurrentType && this.currentImageType!="games"){
        imageType = this.currentImageType;
      }
      appImage.setImageIndex(app.images[imageType],this.appImages[imageType], index)
      this.previewDataChanged.next();
    }
  }

  areImagesAvailable(app: PreviewDataApp, imageType?: string) {
    return this.getTotalLengthOfImages(app, imageType) > 0;
  }

  getTotalLengthOfImages(app: PreviewDataApp, imageType?: string, ignoreCurrentType: boolean = false) {
    if (app) {
      if (!ignoreCurrentType && this.currentImageType!="games") {
        imageType = this.currentImageType;
      }
      return appImage.getMaxLength(app.images[imageType], this.appImages[imageType])
    }
    else
      return 0;
  }

  getCurrentImage(app: PreviewDataApp, imageType?: string) {
    const actualImageType = this.currentImageType === 'games' ? imageType : this.currentImageType;
    return appImage.getCurrentImage(app.images[actualImageType], this.appImages[actualImageType])
  }

  getImages(imageType?: string) {
    const actualImageType = this.currentImageType === 'games' ? imageType : this.currentImageType;
    return this.appImages[actualImageType]
  }

  clearPreviewData() {
    this.previewData = undefined;
    this.clearImageCache(false);
    this.previewVariables.numberOfListItems = 0;
    this.previewDataChanged.next();
  }

  private union(x: string[],y: string[]) {
    return _.union(x,y);
  }

  getAllCategories() {
    return this.previewData ? Object.entries(this.previewData).map(dir=>Object.entries(dir[1]).map(user=>Object.entries(user[1].apps).map(app=>app[1].steamCategories).reduce(this.union,[])).reduce(this.union,[])).reduce(this.union,[]) : [];
  }

  getAllParsers() {
    return this.previewData ? Object.entries(this.previewData).map(dir=>Object.entries(dir[1]).map(user=>Object.entries(user[1].apps).map(app=>app[1].configurationTitle)).reduce(this.union,[])).reduce(this.union,[]) : [];
  }

  // If settingsOnly is true then api filters are not applied
  private clearImageCache(settingsOnly: boolean) {
    for(const artworkType of artworkTypes) {
      for(const imageKey in this.appImages[artworkType]) {
        this.appImages[artworkType][imageKey].defaultImageProviders = [];
        this.appImages[artworkType][imageKey].searchQueries = [];
        this.appImages[artworkType][imageKey].retrieving = false;
        if (!settingsOnly) {
          this.appImages[artworkType][imageKey].content = [];
        }
      }
    }
  }

  private generatePreviewDataCallback() {
    if (this.previewVariables.numberOfQueriedImages !== 0) {
      setTimeout(this.generatePreviewDataCallback.bind(this), 100);
    }
    else {
      let oldPreviewData = this.previewData;
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
            return this.createPreviewData(data.parsedData.parsedConfigs, oldPreviewData);
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
          for(const artworkType of artworkTypes) {
            this.downloadImageUrls(artworkType)
          }
        }
        else {
          this.previewVariables.numberOfListItems = 0;
        }

        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      }).catch((error) => {
        this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      });
    }
  }

  private createPreviewData(data: ParsedUserConfiguration[], oldData?: PreviewData) {
    return Promise.resolve().then(() => {
      let steamTreeData = steam.generateTreeFromParsedConfig(data);

      if (this.appSettings.previewSettings.retrieveCurrentSteamImages)
        return steam.getGridImagesForTree(steamTreeData).then((gridData) => { return { gridData, steamTreeData } });
      else
        return { gridData: steamTreeData, steamTreeData };
    }).then((treeData) => {
      return steam.getNonSteamShortcutsData(treeData.steamTreeData).then((shortcutData) => { return Object.assign(treeData, { shortcutData }); });
    }).then((treeData) => {
      let shortcutsData = treeData.shortcutData.tree;
      let gridData = treeData.gridData.tree;
      let numberOfItems: number = 0;
      let previewData: PreviewData = {};

      this.clearImageCache(true);

      for (let i = 0; i < data.length; i++) {
        let config = data[i];
        let oldDataDir = oldData !== undefined ? oldData[config.steamDirectory] : undefined;

        if (previewData[config.steamDirectory] === undefined)
          previewData[config.steamDirectory] = {};

        for (let j = 0; j < config.foundUserAccounts.length; j++) {
          let userAccount = config.foundUserAccounts[j];
          let oldDataAccount = oldDataDir !== undefined ? oldDataDir[userAccount.accountID] : undefined;

          if (previewData[config.steamDirectory][userAccount.accountID] === undefined) {
            previewData[config.steamDirectory][userAccount.accountID] = {
              username: userAccount.name,
              apps: {}
            };
          }
          else if (previewData[config.steamDirectory][userAccount.accountID].username !== userAccount.name) {
            previewData[config.steamDirectory][userAccount.accountID].username = `${previewData[config.steamDirectory][userAccount.accountID].username} | ${userAccount.name}`;
          }

          for (let k = 0; k < data[i].files.length; k++) {
            let file = config.files[k];
            let executableLocation = file.modifiedExecutableLocation;
            let title = file.finalTitle;
            let appID: string = '';
            if(config.parserType !== 'Steam') {
              appID = steam.generateAppId(executableLocation, title);
            } else {
              appID = steam.lengthenAppId(executableLocation.replace(/\"/g,""));
            }
            let oldDataApp = oldDataAccount !== undefined ? oldDataAccount.apps[appID] : undefined;

            if (shortcutsData[config.steamDirectory][userAccount.accountID][appID] !== undefined) {
              if (shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon'] !== undefined) {
                if (file.localImages['icon'].indexOf(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']) === -1) {
                  file.localImages['icon'].unshift(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']);
                }
              }
            }
            for(const artworkType of artworkTypes) {
              if(this.appImages[artworkType][file.imagePool] === undefined) {
                this.appImages[artworkType][file.imagePool] = {
                  retrieving: false,
                  searchQueries: file.onlineImageQueries,
                  imageProviderAPIs: config.imageProviderAPIs,
                  defaultImageProviders: config.imageProviders,
                  content: []
                }
              } else {
                let currentQueries = this.appImages[artworkType][file.imagePool].searchQueries;
                let currentProviders = this.appImages[artworkType][file.imagePool].defaultImageProviders;
                this.appImages[artworkType][file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
                this.appImages[artworkType][file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
                this.appImages[artworkType][file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
              }
            }

            if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
              let images: {[artworkType: string]: any} = {};
              for(const artworkType of artworkTypes) {
                const steamImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat(artworkIdDict[artworkType])];
                const steamImageUrl = steamImage ? url.encodeFile(steamImage) : undefined;
                images[artworkType] = {
                  steam: steamImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamImageUrl,
                    imageRes: url.imageDimensions(steamImageUrl),
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultImage[artworkType] ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultImage[artworkType],
                    imageRes: url.imageDimensions(file.defaultImage[artworkType]),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                }
              }

              previewData[config.steamDirectory][userAccount.accountID].apps[appID] = {
                entryId: numberOfItems++,
                status: 'add',
                configurationTitle: config.configurationTitle,
                parserId: config.parserId,
                parserType: config.parserType,
                steamCategories: file.steamCategories,
                startInDirectory: file.startInDirectory,
                imageProviders: config.imageProviders,
                argumentString: file.argumentString,
                title: file.finalTitle,
                extractedTitle: file.extractedTitle,
                controllers: config.controllers,
                images: images,
                executableLocation
              };
            }
            else {
              let currentCategories = previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories;
              previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories = _.union(currentCategories, file.steamCategories);
            }
            for(const artworkType of artworkTypes) {
              for (let l = 0; l < file.localImages[artworkType].length; l++) {
                this.addUniqueImage(file.imagePool, {
                  imageProvider: 'LocalStorage',
                  imageUrl: file.localImages[artworkType][l],
                  imageRes: url.imageDimensions(file.localImages[artworkType][l]),
                  loadStatus: 'done'
                }, artworkType)
              }
            }
          }
        }
      }
      return { numberOfItems: numberOfItems, data: previewData };
    });
  }

  downloadImageUrls(imageType: string, imageKeys?: string[], imageProviders?: string[]) {
    if (!this.appSettings.offlineMode) {
      let allImagesRetrieved = true;
      let imageQueue = queue((task, callback) => callback());

      if (imageKeys === undefined || imageKeys.length === 0) {
        imageKeys = Object.keys(this.appImages[imageType]);
      }

      for (let i = 0; i < imageKeys.length; i++) {
        let image: ImagesStatusAndContent = this.appImages[imageType][imageKeys[i]];
        let imageProvidersForKey: string[] = imageProviders === undefined || imageProviders.length === 0 ? image.defaultImageProviders : imageProviders;

        imageProvidersForKey = _.intersection(this.appSettings.enabledProviders, imageProvidersForKey);
        if (image !== undefined && !image.retrieving) {
          let numberOfQueriesForImageKey = image.searchQueries.length * imageProvidersForKey.length;
          if (numberOfQueriesForImageKey > 0) {
            image.retrieving = true;
            allImagesRetrieved = false;
            this.previewVariables.numberOfQueriedImages += numberOfQueriesForImageKey;
            for (let j = 0; j < image.searchQueries.length; j++) {
              this.imageProviderService.instance.retrieveUrls(image.searchQueries[j], imageType, image.imageProviderAPIs,  imageProvidersForKey, <K extends keyof ProviderCallbackEventMap>(event: K, data: ProviderCallbackEventMap[K]) => {
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
                    let newImage = this.addUniqueImage(imageKeys[i], (data as ProviderCallbackEventMap['image']).content, imageType);
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

  isImageUnique(imageKey: string, imageUrl: string, imageType: string) {
    return this.appImages[imageType][imageKey].content.findIndex((item) => item.imageUrl === imageUrl) === -1;
  }

  addUniqueImage(imageKey: string, content: ImageContent, imageType: string) {
    if (this.isImageUnique(imageKey, content.imageUrl, imageType)) {
      this.appImages[imageType][imageKey].content.push(content);
      return this.appImages[imageType][imageKey].content[this.appImages[imageType][imageKey].content.length - 1];
    }
    return null;
  }

  async exportSelection() {
    async function saveImage(imageUrl: string, temporayDir: string, append: string) {
      const extension = imageUrl.split(/[#?]/)[0].split('.').pop().trim();
      var request = require('request').defaults({ encoding: null });

      function doRequest(url: string, filename: string) {
        return new Promise(function (resolve, reject) {
          request(url, function (error: any, res: any, body: any) {
            if (!error && res.statusCode == 200) {
              fs.writeFileSync(filename, body);
              resolve(body);
            } else {
              reject(error);
            }
          });
        });
      }

      if (imageUrl.startsWith("file://")) {
        await fs.copyFile(url.decodeFile(imageUrl), `${temporayDir}${path.sep}${append}.${extension}`);
      }
      else {
        await doRequest(imageUrl, `${temporayDir}${path.sep}${append}.${extension}`);
      }

      return `${append}.${extension}`;
    }

    const options: Electron.OpenDialogSyncOptions = {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose selections folder save location.'
    }

    const result: OpenDialogReturnValue = await dialog.showOpenDialog(options);

    if (result.filePaths !== undefined) {
      let timeout: any;
      try {
        const packagePath = path.join(result.filePaths[0],"srm-image-choices-export/");
        if(fs.existsSync(packagePath)) {
          fs.rmdirSync(packagePath, { recursive: true });
        }
        fs.mkdirSync(packagePath);
        const apps: any[] = [];
        let appsCount: number = 0;

        this.loggerService.info(this.lang.info.preparingExport, { invokeAlert: true, alertTimeout: 3000 });

        for (const directory in this.previewData) {
          for (const userId in this.previewData[directory]) {
            appsCount += Object.keys(this.previewData[directory][userId].apps).length;
          }
        };

        timeout = window.setInterval(() => {
          this.loggerService.info(this.lang.info.exportProgress__i.interpolate({
            progress: `${apps.length}/${appsCount}`
          }), { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true });
        }, 1500);
        for (const directory in this.previewData) {
          for (const userId in this.previewData[directory]) {
            for (const appId in this.previewData[directory][userId].apps) {
              const app: PreviewDataApp = this.previewData[directory][userId].apps[appId];
              let selection: AppSelection = {
                title: app.extractedTitle,
                images: {}
              }
              for(const artworkType of artworkTypes) {
                selection.images[artworkType] = appImage.getCurrentImage(app.images[artworkType], this.appImages[artworkType]) ? {
                  pool: app.images[artworkType].imagePool,
                  filename: await saveImage(appImage.getCurrentImage(app.images[artworkType], this.appImages[artworkType]).imageUrl, packagePath,`${app.extractedTitle}.${artworkType}`)
                }: null;
              }
              apps.push(selection);
            }
          }
        }

        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
        fs.writeFileSync(path.join(packagePath,"_selections.json"), JSON.stringify(apps, null, 2));

        this.loggerService.success(this.lang.success.exportSuccess__i.interpolate({
          path: packagePath
        }), { invokeAlert: true, alertTimeout: 3000 });
      }
      catch (e) {

        if (timeout !== undefined) {
          window.clearTimeout(timeout);
        }
        this.loggerService.error(this.lang.errors.exportError__i.interpolate({
          error: e.message
        }), { invokeAlert: true, alertTimeout: 3000 });
      }
    }
  }

  async importSelection() {

    const options: Electron.OpenDialogSyncOptions = {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose selections folder location.'
    }

    const result: OpenDialogReturnValue = await dialog.showOpenDialog(options);

    if (result.filePaths !== undefined) {
      try {
        const packagePath = result.filePaths[0];

        this.loggerService.info(this.lang.info.readingSelections, { invokeAlert: true, alertTimeout: 3000 });

        let selections: AppSelection[] = JSON.parse(fs.readFileSync(path.join(packagePath,"_selections.json"), 'utf8'));
        let importedApps: string[] = [];

        for (const selection of selections) {
          for(const artworkType of artworkTypes) {
            if(selection.images.grid) {
              this.addUniqueImage(selection.images[artworkType].pool, {
                imageProvider: 'LocalStorage',
                imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images[artworkType].filename}`),
                loadStatus: 'done'
              }, artworkType);
            }
          }
          importedApps.push(selection.title);
        }

        for (const directory in this.previewData) {
          for (const userId in this.previewData[directory]) {
            for (const appId in this.previewData[directory][userId].apps) {
              const app: PreviewDataApp = this.previewData[directory][userId].apps[appId];
              if (importedApps.includes(app.extractedTitle)) {
                for(const artworkType of artworkTypes) {
                  this.setImageIndex(app, this.getTotalLengthOfImages(app,artworkType, true) -1, artworkType, true);
                }
              }
            }
          }
        }
        this.loggerService.success(this.lang.success.importSelectionsSuccess__i.interpolate({
          count: importedApps.length
        }), { invokeAlert: true, alertTimeout: 3000 });
      }
      catch (e) {
        if (e instanceof SyntaxError) {
          this.loggerService.error(this.lang.errors.importJSONFailError__i.interpolate({
            error: e.message
          }), { invokeAlert: true, alertTimeout: 3000 });
        }
        else {
          this.loggerService.error(this.lang.errors.importFailError__i.interpolate({
            error: e.message
          }), { invokeAlert: true, alertTimeout: 3000 });
        }
      }
    }
  }
}
