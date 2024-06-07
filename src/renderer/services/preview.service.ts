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
  OnlineImages,
  PreviewVariables,
  ProviderCallbackEventMap,
  PreviewDataApp,
  AppSettings,
  SteamTree,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
  VDF_AllScreenshotsOutcomes,
  AppSelection,
  UserConfiguration,
  SGDBToArt,
  OnlineProviderType,
  PreviewDataAppImage,
  MultiLocalProviderType,
  ArtworkType,
  ArtworkViewType,
  isArtworkType,
  initArtworkRecord,
  initOnlineProviderRecord
} from '../../models';
import {
  VDF_Manager,
  VDF_Error,
  CategoryManager,
  ControllerManager,
  Acceptable_Error,
  ArtworkCache
} from "../../lib";
import { APP } from '../../variables';
import { queue } from 'async';
import * as steam from "../../lib/helpers/steam";
import * as url from "../../lib/helpers/url";
import * as appImage from "../../lib/helpers/app-image";
import * as ids from '../../lib/helpers/steam';
import { artworkTypes, defaultArtworkType, artworkIdDict, invertedArtworkIdDict } from '../../lib/artwork-types';
import { superTypesMap } from '../../lib/parsers/available-parsers';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import { OpenDialogReturnValue } from 'electron';
import { dialog } from '@electron/remote';
import { onlineProviders, imageProviderNames } from '../../lib/image-providers/available-providers';

@Injectable()

export class PreviewService {
  private appSettings: AppSettings;
  private previewData: PreviewData;
  private previewVariables: PreviewVariables;
  private previewDataChanged: Subject<void>;
  private onlineImages: OnlineImages;
  private currentViewType: ArtworkViewType;
  private batchProgress: BehaviorSubject<{update: string, batch: number}>;
  private categoryManager: CategoryManager;
  private sgdbToArt: SGDBToArt;
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
    this.categoryManager = new CategoryManager();
    this.previewDataChanged = new Subject<void>();
    this.batchProgress = new BehaviorSubject({update: "", batch: -1})
    this.settingsService.onLoad((appSettings: AppSettings) => {
      this.appSettings = appSettings;
    });
    this.onlineImages = initArtworkRecord<OnlineImages[ArtworkType]>(()=>({}));
    this.currentViewType = defaultArtworkType;
    this.imageProviderService.instance.stopEvent.subscribe(() => {
      for(const artworkType of artworkTypes) {
        for(const imagePool in this.onlineImages[artworkType]) {
          this.onlineImages[artworkType][imagePool].retrieving = false;
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

  getCurrentViewType() {
    return this.currentViewType;
  }
  setCurrentViewType(viewType: ArtworkViewType) {
    this.currentViewType = viewType;
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

  updateAppImages(imageKey: string, oldPool: string, artworkType: ArtworkType) {
    this.onlineImages[artworkType][imageKey] = {
      retrieving: false,
      online: initOnlineProviderRecord(()=>null),
      offline: this.onlineImages[artworkType][oldPool].offline,
      parserEnabledProviders: this.onlineImages[artworkType][oldPool].parserEnabledProviders
    }
    for(const providerType of onlineProviders) {
      this.onlineImages[artworkType][imageKey].online[providerType] = {
        searchQueries: [imageKey],
        imageProviderAPIs: this.onlineImages[artworkType][oldPool].online[providerType].imageProviderAPIs,
        content: []
      }
    }
  }

  
  async removeCategories(steamDir: string, userId: string) {
    try {
      const stop = await steam.stopSteam();
      for(let message of stop.messages) { this.loggerService.info(message) }
      await this.categoryManager.removeAllCategoriesAndWrite(steamDir, userId);
      if(stop.acted) {
        const start= await steam.startSteam();
        for(let message of start.messages) { this.loggerService.info(message) }
      }
    } catch(error) {
      this.loggerService.error(this.lang.errors.categorySaveError, { invokeAlert: true, alertTimeout: 3000 });
      this.loggerService.error(this.lang.errors.categorySaveError__i.interpolate({error:error.message}));
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
    this.previewVariables.listIsBeingSaved = true;
    let exAppIds: VDF_ExtraneousItemsData = undefined;
    let addedCats: VDF_AddedCategoriesData = undefined;
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
        return vdfManager.mergeData(this.previewData, this.onlineImages, this.appSettings.previewSettings.deleteDisabledShortcuts)
      })
    } else {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        return vdfManager.removeAllAddedEntries()
      })
    }
    chain = chain.then(({extraneousAppIds, addedCategories}: {extraneousAppIds: VDF_ExtraneousItemsData, addedCategories: VDF_AddedCategoriesData}) => {
      exAppIds = extraneousAppIds; //Non artwork-only extraneous app ids
      addedCats = addedCategories; //Added categories for all app ids
    })
    .then(async () => {
      if(!removeAll && !this.appSettings.previewSettings.disableCategories) {
        const stop = await steam.stopSteam();
        for(let message of stop.messages) { this.loggerService.info(message) }
        this.loggerService.info(this.lang.info.savingCategories)
        await this.categoryManager.save(this.previewData, exAppIds, addedCats)
        if(stop.acted) {
          const start= await steam.startSteam();
          for(let message of start.messages) { this.loggerService.info(message) }
        }
      }
    }).catch((error: Acceptable_Error | Error) => {
      if(error instanceof Acceptable_Error) {
        this.loggerService.error(this.lang.errors.categorySaveError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(this.lang.errors.categorySaveError__i.interpolate({error:error.message}));
      } else {
        throw error;
      }
    })
    .then(() => {
      if(!removeAll) {
        this.loggerService.info(this.lang.info.savingControllers)
        const controllerManager = new ControllerManager();
        return controllerManager.save(this.previewData, exAppIds)
      }
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
        this.loggerService.info(this.lang.info.writingVDF_entries__i.interpolate({ batchSize: this.appSettings.batchDownloadSize }), { invokeAlert: true, alertTimeout: 3000 })
      }
      if (batchWrite) {
        vdfManager.getBatchProgress().subscribe(({update, batch}: {update: string, batch: number})=> {
          if(batch > -1) {
            this.loggerService.info(update, {invokeAlert: true, alertTimeout: 3000})
            this.batchProgress.next({update: update, batch: batch})
          }
        })
      }
      return vdfManager.write(batchWrite, this.appSettings.batchDownloadSize);
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
          const artworkType = invertedArtworkIdDict[gridName.replace(/^\d+/,'')];
          const steamImageUrl = url.encodeFile(outcomes[steamDirectory][userId].successes[gridName]);
          const app = this.previewData[steamDirectory][userId].apps[longId];
          if(app && artworkType) {
            this.previewData[steamDirectory][userId].apps[longId].images[artworkType].singleProviders.steam = {
              imageProvider: imageProviderNames.steam,
              imageUrl: steamImageUrl,
              imageRes: url.imageDimensions(steamImageUrl),
              loadStatus: 'done'
            }
            this.setImageIndex(app, 0, artworkType, true);
          }
        }
      }
    }
    this.previewDataChanged.next()
  }

  loadImage(app: PreviewDataApp, artworkType?: ArtworkType, imageIndex?: number) {
    if (app) {
      let image: ImageContent;
      const actualArtworkType = isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
      if(imageIndex) {
        image = appImage.getImage(app.images[actualArtworkType],this.onlineImages[actualArtworkType], imageIndex)
      } else {
        image = appImage.getCurrentImage(app.images[actualArtworkType], this.onlineImages[actualArtworkType]);
      }
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
      for(const imageKey in this.onlineImages[artworkType]) {
        for(let provider of onlineProviders) {
          for (let i = 0; i < this.onlineImages[artworkType][imageKey].online[provider].content.length; i++) {
            this.preloadImage(this.onlineImages[artworkType][imageKey].online[provider].content[i]);
          }
        }
      }
    }
  }

  setImageIndex(app: PreviewDataApp, index: number, artworkType?: ArtworkType, ignoreCurrentType: boolean = false) {
    if (app) {
      const actualArtworkType = !ignoreCurrentType && isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
      appImage.setImageIndex(app.images[actualArtworkType],this.onlineImages[actualArtworkType], index)
      this.previewDataChanged.next();
    }
  }

  areImagesAvailable(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.getTotalLengthOfImages(app, artworkType) > 0;
  }

  getTotalLengthOfImages(app: PreviewDataApp, artworkType?: ArtworkType, ignoreCurrentType: boolean = false) {
    if (app) {
      const actualArtworkType = !ignoreCurrentType && isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
      return appImage.getMaxLength(app.images[actualArtworkType], this.onlineImages[actualArtworkType]).maxLength;
    }
    return 0;
  }

  getCurrentImage(app: PreviewDataApp, artworkType?: ArtworkType) {
    const actualArtworkType = isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
    return appImage.getCurrentImage(app.images[actualArtworkType], this.onlineImages[actualArtworkType])
  }

  getImages(artworkType?: ArtworkType) {
    const actualArtworkType = isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
    return this.onlineImages[actualArtworkType]
  }
  getImage(app: PreviewDataApp, index: number, artworkType?: ArtworkType) {
    const actualArtworkType = isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
    return appImage.getImage(app.images[actualArtworkType], this.onlineImages[actualArtworkType], index)
  }
  getRanges(app: PreviewDataApp,artworkType?: ArtworkType) {
    const actualArtworkType = isArtworkType(this.currentViewType) ? this.currentViewType : artworkType;
    return appImage.getImageRanges(app.images[actualArtworkType], this.onlineImages[actualArtworkType])
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
      for(const imageKey in this.onlineImages[artworkType]) {
        for(const provider of onlineProviders) {
          this.onlineImages[artworkType][imageKey].retrieving = false;
          this.onlineImages[artworkType][imageKey].online[provider] = {
            searchQueries: [],
            content: settingsOnly ? this.onlineImages[artworkType][imageKey].online[provider].content : [],
            imageProviderAPIs: this.onlineImages[artworkType][imageKey].online[provider].imageProviderAPIs,
          }
        }
      }
    }
  }

  private async generatePreviewDataCallback() {
    if (this.previewVariables.numberOfQueriedImages !== 0) {
      setTimeout(this.generatePreviewDataCallback.bind(this), 100);
    }
    else {
      this.previewData = undefined;
      let previewData;
      this.loggerService.info(this.lang.info.executingParsers, { invokeAlert: true });
      try {
        let data = await this.parsersService.executeFileParser();
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
            if(!this.appSettings.previewSettings.disableCategories){
              this.loggerService.info(this.lang.info.shutdownSteam, { invokeAlert: true, alertTimeout: 3000 });
            }
            previewData = await this.createPreviewData(data.parsedData.parsedConfigs);
          }
        }
        else if (data.invalid.length === 0 && data.skipped.length === 0) {
          if (this.parsersService.getUserConfigurationsArray().length === 0)
            this.loggerService.info(this.lang.info.noParserConfigurations, { invokeAlert: true, alertTimeout: 3000 });
          else
            this.loggerService.info(this.lang.info.parserFoundNoFiles, { invokeAlert: true, alertTimeout: 3000 });
        }
        if (previewData && previewData.numberOfItems > 0) {
          this.previewData = previewData.data;
          this.previewVariables.numberOfListItems = previewData.numberOfItems;
          await this.readArtworkCache();
          for(const artworkType of artworkTypes) {
            this.downloadImageUrls(artworkType)
          }
        }
        else {
          this.previewVariables.numberOfListItems = 0;
          this.loggerService.info('Enabled parsers returned no apps', { invokeAlert: true, alertTimeout: 3000 })
        }

        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      } catch (error) {
        this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      };
    }
  }

  private async readArtworkCache() {
    const artworkCache = new ArtworkCache();
    await artworkCache.read();
    this.sgdbToArt = artworkCache.sgdbToArt;
  }

  private async createPreviewData(data: ParsedUserConfiguration[]) {
      let steamTreeData = steam.generateTreeFromParsedConfig(data);
      let treeData: {gridData: SteamTree<any>, steamTreeData: SteamTree<any>};
      if (this.appSettings.previewSettings.retrieveCurrentSteamImages)
        treeData = await steam.getGridImagesForTree(steamTreeData).then((gridData) => { return { gridData, steamTreeData } });
      else
        treeData = { gridData: steamTreeData, steamTreeData };

      let nonSteamShortcutsData = await steam.getNonSteamShortcutsData(treeData.steamTreeData)
      .then((shortcutData) => { return Object.assign(treeData, { shortcutData }); });
      let shortcutsData = nonSteamShortcutsData.shortcutData.tree;
      let gridData = nonSteamShortcutsData.gridData.tree;
      let numberOfItems: number = 0;
      let previewData: PreviewData = {};

      this.clearImageCache(false);

      for (let i = 0; i < data.length; i++) {
        let config = data[i];
        if (previewData[config.steamDirectory] === undefined)
          previewData[config.steamDirectory] = {};

        for (let j = 0; j < config.foundUserAccounts.length; j++) {
          let userAccount = config.foundUserAccounts[j];

          if (previewData[config.steamDirectory][userAccount.accountID] === undefined) {
            previewData[config.steamDirectory][userAccount.accountID] = {
              username: userAccount.name,
              excluded: data.map(x=>x.excluded).reduce((x,y)=>x.concat(y),[]),
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
            if(superTypesMap[config.parserType] !== 'ArtworkOnly') {
              appID = steam.generateAppId(executableLocation, title);
            } else {
              appID = steam.lengthenAppId(executableLocation.replace(/\"/g,""));
            }

            if (shortcutsData[config.steamDirectory][userAccount.accountID][appID] !== undefined) {
              if (shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon'] !== undefined) {
                if (file.localImages['icon'].indexOf(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']) === -1) {
                  file.localImages['icon'].unshift(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']);
                }
              }
            }
            for(const artworkType of artworkTypes) {
              if(this.onlineImages[artworkType][file.imagePool] === undefined) {
                this.onlineImages[artworkType][file.imagePool] = {
                  online: {
                    sgdb: {
                      searchQueries: file.onlineImageQueries,
                      imageProviderAPIs: config.imageProviderAPIs.sgdb,
                      content: []
                    }, 
                    steamCDN: {
                      searchQueries: file.onlineImageQueries,
                      imageProviderAPIs: config.imageProviderAPIs.steamCDN||{},
                      content: []
                    }
                  },
                  offline: {local: [], manual: [], imported: []},
                  retrieving: false,
                  parserEnabledProviders: config.imageProviders
                }
              } else {
                for(const provider of config.imageProviders) {
                  let currentQueries = this.onlineImages[artworkType][file.imagePool].online[provider].searchQueries;
                  this.onlineImages[artworkType][file.imagePool].online[provider].imageProviderAPIs = config.imageProviderAPIs[provider];
                  this.onlineImages[artworkType][file.imagePool].online[provider].searchQueries = _.union(currentQueries, file.onlineImageQueries);
                }
              }
            }

            if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
              let images: Record<ArtworkType,PreviewDataAppImage> = initArtworkRecord<PreviewDataAppImage>(()=>null);
              for(const artworkType of artworkTypes) {
                const steamImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat(artworkIdDict[artworkType])];
                const steamImageUrl = steamImage ? url.encodeFile(steamImage) : undefined;
                images[artworkType] = {
                  singleProviders: {
                    steam: steamImage ? {
                      imageProvider: imageProviderNames.steam,
                      imageUrl: steamImageUrl,
                      imageRes: url.imageDimensions(steamImageUrl),
                      loadStatus: 'done'
                    } : undefined,
                    artworkBackup: file.backupImage[artworkType] ? {
                      imageProvider: imageProviderNames.artworkBackup,
                      imageUrl: file.backupImage[artworkType],
                      imageRes: url.imageDimensions(file.backupImage[artworkType]),
                      loadStatus: 'done'
                    } : undefined
                  },
                  default: file.defaultImage[artworkType] ? {
                    imageProvider: imageProviderNames.default,
                    imageUrl: file.defaultImage[artworkType],
                    imageRes: url.imageDimensions(file.defaultImage[artworkType]),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                }
                for(let localUrl of file.localImages[artworkType]) {
                  this.addUniqueLocalImage(file.imagePool, {
                    imageProvider: imageProviderNames.local,
                    imageUrl: localUrl,
                    imageRes: url.imageDimensions(localUrl),
                    loadStatus: 'done'
                  }, artworkType, 'local')
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
                onlineProviders: config.imageProviders,
                drmProtect: config.drmProtect,
                argumentString: file.argumentString,
                filePath: file.filePath,
                title: file.finalTitle,
                extractedTitle: file.extractedTitle,
                steamInputEnabled: config.steamInputEnabled,
                controllers: config.controllers,
                images: images,
                executableLocation
              };
            }
            else {
              let currentCategories = previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories;
              previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories = _.union(currentCategories, file.steamCategories);
            }
          }
        }
      }
      return { numberOfItems: numberOfItems, data: previewData };
  }

  downloadImageUrls(artworkType: ArtworkType, imKeys?: string[]) {
    if (!this.appSettings.offlineMode) {
      let allImagesRetrieved = true;
      let imageQueue = queue((task, callback) => callback());
      const imageKeys = imKeys && imKeys.length ? imKeys : Object.keys(this.onlineImages[artworkType]);
      for (let imageKey of imageKeys) {
        const imageByPool = this.onlineImages[artworkType][imageKey]
        if(imageByPool.retrieving) { continue; }
        const imageByProvider = imageByPool.online;
        const parserEnabledProviders = imageByPool.parserEnabledProviders;
        const imageProvidersForKey: OnlineProviderType[] = _.intersection(parserEnabledProviders, this.appSettings.enabledProviders);
        this.previewVariables.numberOfQueriedImages += imageProvidersForKey.map((provider) => imageByProvider[provider].searchQueries.length).reduce((x,y)=>x+y, 0);
        let retrievingByProvider = Object.fromEntries(onlineProviders.map(x=>[x, imageProvidersForKey.includes(x) && !!imageByProvider[x].searchQueries.length]));
        imageByPool.retrieving = Object.values(retrievingByProvider).reduce((x,y)=> x||y, false)
        for(let provider of imageProvidersForKey) {
          const image = imageByProvider[provider];
          if (image !== undefined && image.searchQueries.length) {
            allImagesRetrieved = false;
            for (let j = 0; j < image.searchQueries.length; j++) {
              this.imageProviderService.instance.retrieveUrls(image.searchQueries[j], artworkType, image.imageProviderAPIs, provider, <K extends keyof ProviderCallbackEventMap>(event: K, data: ProviderCallbackEventMap[K]) => {
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
                    let imageContent = (data as ProviderCallbackEventMap['image']).content;
                    let returnedProvider = (data as ProviderCallbackEventMap['image']).provider;
                    let skip=false;
                    let preInsert=false;
                    if(returnedProvider === 'sgdb') {
                      const imageArtCache = (this.sgdbToArt[artworkType]||{})[imageContent.imageGameId]
                      preInsert = imageArtCache && imageArtCache.artworkId == imageContent.imageArtworkId;
                      skip = imageContent.imageUrl.slice(-1) == '?'; // DMCA filter. Nintendo Sucks.
                    }
                    if(!skip) {
                      let newImage: ImageContent = this.addUniqueImage(imageKey, imageContent, artworkType, returnedProvider, preInsert);
                      if (newImage !== null && this.appSettings.previewSettings.preload) {
                        this.preloadImage(newImage);
                      }
                    }
                    this.previewDataChanged.next();
                  });
                  break;
                  case 'completed':
                    {
                    retrievingByProvider[provider] = false;
                    imageByPool.retrieving = Object.values(retrievingByProvider).reduce((x,y)=> x||y)
                    if (--this.previewVariables.numberOfQueriedImages === 0) {
                      allImagesRetrieved=true;
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

  isImageUnique(imageKey: string, imageUrl: string, artworkType: ArtworkType, provider: OnlineProviderType) {
    return this.onlineImages[artworkType][imageKey].online[provider].content.findIndex((item) => item.imageUrl === imageUrl) === -1;
  }

  addUniqueImage(imageKey: string, content: ImageContent, artworkType: ArtworkType, provider: OnlineProviderType, preinsert?: boolean) {
    if (this.isImageUnique(imageKey, content.imageUrl, artworkType, provider)) {
      if(preinsert) {
        this.onlineImages[artworkType][imageKey].online[provider].content.unshift(content);
        return this.onlineImages[artworkType][imageKey].online[provider].content[0];
      } else {
        this.onlineImages[artworkType][imageKey].online[provider].content.push(content);
        return ((x)=>x[x.length-1])(this.onlineImages[artworkType][imageKey].online[provider].content)
      }
    }
    return null;
  }

  isLocalImageUnique(imageKey: string, imageUrl: string, artworkType: ArtworkType, provider: MultiLocalProviderType) {
    return this.onlineImages[artworkType][imageKey].offline[provider].findIndex((item) => item.imageUrl === imageUrl) === -1;
  }

  addUniqueLocalImage(imageKey: string, content: ImageContent, artworkType: ArtworkType, provider: MultiLocalProviderType, preinsert?: boolean) {
    if (this.isLocalImageUnique(imageKey, content.imageUrl, artworkType, provider)) {
        if(preinsert) {
          this.onlineImages[artworkType][imageKey].offline[provider].unshift(content)
          return this.onlineImages[artworkType][imageKey].offline[provider][0]
        } else {
          this.onlineImages[artworkType][imageKey].offline[provider].push(content)
          return ((x)=>x[x.length-1])(this.onlineImages[artworkType][imageKey].offline[provider]);
        }
    }
    return null;
  }

  async exportSelection() {
    const imageDownloader = new url.ImageDownloader();
    async function saveImage(imageUrl: string, temporaryDir: string, append: string) {
      const extension = imageUrl.split(/[#?]/)[0].split('.').pop().trim();
      const filename = `${append}.${extension}`;
      await imageDownloader.downloadAndSaveImage(imageUrl, path.join(temporaryDir,filename))
      return filename
    }

    const options: Electron.OpenDialogSyncOptions = {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose selections folder save location.'
    }

    const result: OpenDialogReturnValue = await dialog.showOpenDialog(options);

    if (result.filePaths !== undefined) {
      let timeout: any;
      try {
        const packagePath = path.join(result.filePaths[0],"srm-image-choices");
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
              const saveId = app.changedId ? app.changedId : appId;
              let selection: AppSelection = {
                title: app.extractedTitle,
                images: { tall: null, long: null, hero: null, logo: null, icon: null }
              }
              for(const artworkType of artworkTypes) {
                const currentImage = appImage.getCurrentImage(app.images[artworkType], this.onlineImages[artworkType]);
                if(currentImage) {
                  const imageUrl = currentImage.imageUrl;
                  const nintendoSucks = imageUrl.slice(-1) == '?';
                  if(!nintendoSucks) {
                    selection.images[artworkType] = {
                      pool: app.images[artworkType].imagePool,
                      filename: await saveImage(imageUrl, packagePath,`${saveId}.${artworkType}`)
                    };
                  }
                }
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
            if(selection.images[artworkType]) {
              this.addUniqueLocalImage(selection.images[artworkType].pool, {
                imageProvider: imageProviderNames.imported,
                imageUrl: url.encodeFile(path.join(packagePath, selection.images[artworkType].filename)),
                loadStatus: 'done'
              }, artworkType, 'imported')
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
                  this.setImageIndex(app, this.getTotalLengthOfImages(app, artworkType, true) -1, artworkType, true);
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
