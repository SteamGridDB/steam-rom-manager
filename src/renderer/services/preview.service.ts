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
  SteamTree, userAccountData, VDF_ExtraneousItemsData, ErrorData, AppSelection, AppSelectionImages, AppSelectionImage
} from '../../models';
import { VDF_Manager, VDF_Error, CategoryManager, ControllerManager, Acceptable_Error } from "../../lib";
import { APP } from '../../variables';
import { queue } from 'async';
import * as steam from "../../lib/helpers/steam";
import * as url from "../../lib/helpers/url";
import * as unique_ids from "../../lib/helpers/unique-ids";
import * as appImage from "../../lib/helpers/app-image";
import * as ids from '../../lib/helpers/steam';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as FileSaver from 'file-saver';
import * as path from "path";
import { getMaxLength } from "../../lib/helpers/app-image/get-max-length";
import { P } from '@angular/core/src/render3';
import { OpenDialogReturnValue } from 'electron';
@Injectable()

export class PreviewService {
  private appSettings: AppSettings;
  private previewData: PreviewData;
  private previewVariables: PreviewVariables;
  private previewDataChanged: Subject<boolean>;
  private appImages: AppImages;
  private appTallImages: AppImages;
  private appHeroImages: AppImages;
  private appLogoImages: AppImages;
  private appIcons: AppImages;
  private allEditedSteamDirectories: string[];
  private imageTypes: string[];
  private currentImageType: string;

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
    this.appTallImages = {};
    this.appHeroImages = {};
    this.appLogoImages = {};
    this.appIcons = {};
    this.imageTypes = [
      "long",
      "tall",
      "hero",
      "logo",
      "icon",
      "games"
    ];
    this.currentImageType = "long";
    this.imageProviderService.instance.stopEvent.subscribe(() => {
      for (let imageKey in this.appImages) {
        this.appImages[imageKey].retrieving = false;
      }
      for(let imageKey in this.appTallImages) {
        this.appTallImages[imageKey].retrieving = false;
      }
      for(let imageKey in this.appHeroImages) {
        this.appHeroImages[imageKey].retrieving = false;
      }
      for(let imageKey in this.appLogoImages) {
        this.appLogoImages[imageKey].retrieving = false;
      }
      for(let imageKey in this.appIcons) {
        this.appIcons[imageKey].retrieving = false;
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

  getPreviewVariables() {
    return this.previewVariables;
  }

  getImageTypes() {
    return this.imageTypes;
  }

  getImageType() {
    return this.currentImageType;
  }
  setImageType(imageType: string) {
    this.currentImageType = imageType;
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

  saveData(remove: boolean): Promise<any> {

    let knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    if (this.previewVariables.listIsBeingSaved) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (!remove && this.previewVariables.numberOfListItems === 0) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (this.previewVariables.listIsBeingRemoved) {
      return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }
    else if (remove && knownSteamDirectories.length === 0) {
      return Promise.resolve().then(() => { this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    }

    let vdfManager = new VDF_Manager();
    let categoryManager = new CategoryManager();
    let controllerManager = new ControllerManager();
    this.previewVariables.listIsBeingSaved = true;

    let extraneousAppIds: VDF_ExtraneousItemsData = undefined;
    let chain: Promise<any> =  Promise.resolve().then(()=>{
      this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.prepare(remove ? knownSteamDirectories : this.previewData)
    })
    .then(()=>{
      this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.backup();
    })
    .then(()=>{
      this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });
      return vdfManager.read();
    })
    if(!remove) {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.mergingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        return vdfManager.mergeData(this.previewData, this.appImages, this.appTallImages, this.appHeroImages, this.appLogoImages,this.appIcons, this.appSettings.previewSettings.deleteDisabledShortcuts)
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
      return categoryManager.save(this.previewData, extraneousAppIds, remove)
    }).catch((error: Acceptable_Error | Error) => {
      if(error instanceof Acceptable_Error) {
        this.loggerService.error(this.lang.errors.categorySaveError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(this.lang.errors.categorySaveError__i.interpolate({error:error.message}));
      } else {
        throw error;
      }
    })
    .then(() => {
      this.loggerService.info('Saving controllers')
      return controllerManager.save(this.previewData, extraneousAppIds, remove)
    }).catch((error: Acceptable_Error | Error) => {
      if(error instanceof Acceptable_Error) {
        this.loggerService.error(this.lang.errors.controllerSaveError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(this.lang.errors.controllerSaveError__i.interpolate({error:error.message}));
      } else {
        throw error;
      }
    })
    .then(() => {
      this.loggerService.info('Writing VDFs')
      return vdfManager.write();
    })
    .then(() => {
      this.previewVariables.listIsBeingSaved = false;
      if (remove) {
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

  loadImage(app: PreviewDataApp, imagetype?: string) {
    if (app) {
      let image: ImageContent;
      if (this.currentImageType === 'long' || (this.currentImageType==='games' && imagetype==='long')) {
        image = appImage.getCurrentImage(app.images, this.appImages);
      } else if (this.currentImageType === 'tall' || (this.currentImageType==='games' && imagetype==='tall') ) {
        image = appImage.getCurrentImage(app.tallimages, this.appTallImages);
      } else if (this.currentImageType === 'hero' || (this.currentImageType==='games' && imagetype==='hero') ) {
        image = appImage.getCurrentImage(app.heroimages, this.appHeroImages);
      } else if (this.currentImageType === 'logo' || (this.currentImageType==='games' && imagetype==='logo') ) {
        image = appImage.getCurrentImage(app.logoimages, this.appLogoImages);
      } else if (this.currentImageType === 'icon' || (this.currentImageType==='games' && imagetype==='icon') ) {
        image = appImage.getCurrentImage(app.icons, this.appIcons);
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
    for (let imageKey in this.appImages) {
      for (let i = 0; i < this.appImages[imageKey].content.length; i++) {
        this.preloadImage(this.appImages[imageKey].content[i]);
      }
    }
    for (let imageKey in this.appTallImages) {
      for (let i = 0; i < this.appTallImages[imageKey].content.length; i++) {
        this.preloadImage(this.appTallImages[imageKey].content[i]);
      }
    }
    for (let imageKey in this.appHeroImages) {
      for (let i = 0; i < this.appHeroImages[imageKey].content.length; i++) {
        this.preloadImage(this.appHeroImages[imageKey].content[i]);
      }
    }
    for (let imageKey in this.appLogoImages) {
      for (let i = 0; i < this.appLogoImages[imageKey].content.length; i++) {
        this.preloadImage(this.appLogoImages[imageKey].content[i]);
      }
    }
    for (let imageKey in this.appIcons) {
      for (let i = 0; i < this.appIcons[imageKey].content.length; i++) {
        this.preloadImage(this.appIcons[imageKey].content[i]);
      }
    }
  }

  setImageIndex(app: PreviewDataApp, index: number, imagetype?: string, ignoreCurrentType: boolean = false) {
    if (app) {
      if (!ignoreCurrentType && this.currentImageType!="games"){
        imagetype = this.currentImageType;
      }
      if (imagetype === 'long') {
        appImage.setImageIndex(app.images, this.appImages, index);
      } else if (imagetype === 'tall') {
        appImage.setImageIndex(app.tallimages, this.appTallImages, index);
      } else if (imagetype === 'hero') {
        appImage.setImageIndex(app.heroimages, this.appHeroImages, index);
      } else if (imagetype === 'logo') {
        appImage.setImageIndex(app.logoimages, this.appLogoImages, index);
      } else if (imagetype === 'icon') {
        appImage.setImageIndex(app.icons, this.appIcons, index);
      }

      this.previewDataChanged.next();
    }
  }

  areImagesAvailable(app: PreviewDataApp, imagetype?: string) {
    return this.getTotalLengthOfImages(app, imagetype) > 0;
  }

  getTotalLengthOfImages(app: PreviewDataApp, imagetype?: string, ignoreCurrentType: boolean = false) {
    if (app) {
      if (!ignoreCurrentType && this.currentImageType!="games") {
        imagetype = this.currentImageType;
      }
      if (imagetype === 'long') {
        return appImage.getMaxLength(app.images, this.appImages);
      } else if (imagetype === 'tall') {
        return appImage.getMaxLength(app.tallimages, this.appTallImages);
      } else if (imagetype === 'hero') {
        return appImage.getMaxLength(app.heroimages, this.appHeroImages);
      } else if (imagetype === 'logo') {
        return appImage.getMaxLength(app.logoimages, this.appLogoImages);
      } else if (imagetype === 'icon') {
        return appImage.getMaxLength(app.icons, this.appIcons);
      }
    }
    else
      return 0;
  }

  getCurrentImage(app: PreviewDataApp, imagetype?: string) {
    if (this.currentImageType === 'long' || (this.currentImageType=='games' && imagetype=='long')) {
      return appImage.getCurrentImage(app.images, this.appImages);
    } else if (this.currentImageType === 'tall' || (this.currentImageType=='games' && imagetype=='tall')) {
      return appImage.getCurrentImage(app.tallimages, this.appTallImages);
    } else if (this.currentImageType === 'hero' || (this.currentImageType=='games' && imagetype=='hero')) {
      return appImage.getCurrentImage(app.heroimages, this.appHeroImages);
    } else if (this.currentImageType === 'logo'|| (this.currentImageType=='games' && imagetype=='logo')) {
      return appImage.getCurrentImage(app.logoimages, this.appLogoImages);
    } else if (this.currentImageType === 'icon'|| (this.currentImageType=='games' && imagetype=='icon')) {
      return appImage.getCurrentImage(app.icons, this.appIcons);
    }
  }

  getImages(imagetype?: string ) {
    if (this.currentImageType === 'long' || (this.currentImageType=='games' && imagetype=='long')) {
      return this.appImages
    } else if (this.currentImageType === 'tall' || (this.currentImageType=='games' && imagetype=='tall')) {
      return this.appTallImages;
    } else if (this.currentImageType === 'hero' || (this.currentImageType=='games' && imagetype=='hero')) {
      return this.appHeroImages;
    } else if (this.currentImageType === 'logo'|| (this.currentImageType=='games' && imagetype=='logo')) {
      return this.appLogoImages;
    } else if (this.currentImageType === 'icon'|| (this.currentImageType=='games' && imagetype=='icon')) {
      return this.appIcons;
    }
  }

  clearPreviewData() {
    this.previewData = undefined;
    this.clearImageCache(false);
    this.previewVariables.numberOfListItems = 0;
    this.previewDataChanged.next();
  }

  getAllCategories() {
    const union = (x: string[],y: string[])=>_.union(x,y);
    return this.previewData ? Object.entries(this.previewData).map(dir=>Object.entries(dir[1]).map(user=>Object.entries(user[1].apps).map(app=>app[1].steamCategories).reduce(union,[])).reduce(union,[])).reduce(union,[]) : [];
  }

  // If settingsOnly is true then api filters are not applied
  private clearImageCache(settingsOnly: boolean) {
    for (let imageKey in this.appImages) {
      this.appImages[imageKey].defaultImageProviders = [];
      this.appImages[imageKey].searchQueries = [];
      this.appImages[imageKey].retrieving = false;
      if (!settingsOnly)
        this.appImages[imageKey].content = [];
    }
    for (let imageKey in this.appTallImages) {
      this.appTallImages[imageKey].defaultImageProviders = [];
      this.appTallImages[imageKey].searchQueries = [];
      this.appTallImages[imageKey].retrieving = false;
      if (!settingsOnly)
        this.appTallImages[imageKey].content = [];
    }
    for (let imageKey in this.appHeroImages) {
      this.appHeroImages[imageKey].defaultImageProviders = [];
      this.appHeroImages[imageKey].searchQueries = [];
      this.appHeroImages[imageKey].retrieving = false;
      if (!settingsOnly)
        this.appHeroImages[imageKey].content = [];
    }
    for (let imageKey in this.appLogoImages) {
      this.appLogoImages[imageKey].defaultImageProviders = [];
      this.appLogoImages[imageKey].searchQueries = [];
      this.appLogoImages[imageKey].retrieving = false;
      if (!settingsOnly)
        this.appLogoImages[imageKey].content = [];
    }
    for (let imageKey in this.appIcons) {
      this.appIcons[imageKey].defaultImageProviders = [];
      this.appIcons[imageKey].searchQueries = [];
      this.appIcons[imageKey].retrieving = false;
      if (!settingsOnly)
        this.appIcons[imageKey].content = [];
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
          this.downloadImageUrls('long');
          this.downloadImageUrls('tall');
          this.downloadImageUrls('hero');
          this.downloadImageUrls('logo');
          this.downloadImageUrls('icon');
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
                if (file.localIcons.indexOf(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']) === -1) {
                  file.localIcons.unshift(shortcutsData[config.steamDirectory][userAccount.accountID][appID]['icon']);
                }
              }
            }

            if (this.appImages[file.imagePool] === undefined) {
              this.appImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                imageProviderAPIs: config.imageProviderAPIs,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appImages[file.imagePool].searchQueries;
              let currentProviders = this.appImages[file.imagePool].defaultImageProviders;

              this.appImages[file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
              this.appImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appTallImages[file.imagePool] === undefined) {
              this.appTallImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                imageProviderAPIs: config.imageProviderAPIs,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appTallImages[file.imagePool].searchQueries;
              let currentProviders = this.appTallImages[file.imagePool].defaultImageProviders;

              this.appTallImages[file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
              this.appTallImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appTallImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appHeroImages[file.imagePool] === undefined) {
              this.appHeroImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                imageProviderAPIs: config.imageProviderAPIs,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appHeroImages[file.imagePool].searchQueries;
              let currentProviders = this.appHeroImages[file.imagePool].defaultImageProviders;

              this.appHeroImages[file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
              this.appHeroImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appHeroImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appLogoImages[file.imagePool] === undefined) {
              this.appLogoImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                imageProviderAPIs: config.imageProviderAPIs,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appLogoImages[file.imagePool].searchQueries;
              let currentProviders = this.appLogoImages[file.imagePool].defaultImageProviders;

              this.appLogoImages[file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
              this.appLogoImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appLogoImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appIcons[file.imagePool] === undefined) {
              this.appIcons[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                imageProviderAPIs: config.imageProviderAPIs,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appIcons[file.imagePool].searchQueries;
              let currentProviders = this.appIcons[file.imagePool].defaultImageProviders;
              this.appIcons[file.imagePool].imageProviderAPIs = config.imageProviderAPIs;
              this.appIcons[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appIcons[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }


            if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
              let steamImage = gridData[config.steamDirectory][userAccount.accountID][appID];
              let steamTallImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('p')];
              let steamHeroImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('_hero')];
              let steamLogoImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('_logo')];
              let steamIcon = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('_icon')];
              let steamImageUrl = steamImage ? url.encodeFile(steamImage) : undefined;
              let steamTallImageUrl = steamTallImage ? url.encodeFile(steamTallImage) : undefined;
              let steamHeroImageUrl = steamHeroImage ? url.encodeFile(steamHeroImage) : undefined;
              let steamLogoImageUrl = steamLogoImage ? url.encodeFile(steamLogoImage) : undefined;
              let steamIconUrl = steamIcon ? url.encodeFile(steamIcon) : undefined;

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
                images: {
                  steam: steamImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamImageUrl,
                    imageRes: url.imageDimensions(steamImageUrl),
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultImage,
                    imageRes: url.imageDimensions(file.defaultImage),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                tallimages: {
                  steam: steamTallImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamTallImageUrl,
                    imageRes: url.imageDimensions(steamTallImageUrl),
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultTallImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultTallImage,
                    imageRes: url.imageDimensions(file.defaultTallImage),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                heroimages: {
                  steam: steamHeroImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamHeroImageUrl,
                    imageRes: url.imageDimensions(steamHeroImageUrl),

                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultHeroImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultHeroImage,
                    imageRes: url.imageDimensions(file.defaultHeroImage),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                logoimages: {
                  steam: steamLogoImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamLogoImageUrl,
                    imageRes: url.imageDimensions(steamLogoImageUrl),

                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultLogoImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultLogoImage,
                    imageRes: url.imageDimensions(file.defaultLogoImage),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                icons: {
                  steam: steamIcon ? {
                    imageProvider: 'Steam',
                    imageUrl: steamIconUrl,
                    imageRes: url.imageDimensions(steamIconUrl),

                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultIcon ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultIcon,
                    imageRes: url.imageDimensions(file.defaultIcon),
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                executableLocation
              };
            }
            else {
              let currentCategories = previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories;
              previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories = _.union(currentCategories, file.steamCategories);
            }

            for (let l = 0; l < file.localImages.length; l++) {

              this.addUniqueImage(file.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl: file.localImages[l],
                imageRes: url.imageDimensions(file.localImages[l]),
                loadStatus: 'done'
              },'long')

            }
            for (let l = 0; l < file.localTallImages.length; l++) {
              this.addUniqueImage(file.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl: file.localTallImages[l],
                imageRes: url.imageDimensions(file.localTallImages[l]),
                loadStatus: 'done'
              },'tall')
            }
            for (let l = 0; l < file.localHeroImages.length; l++) {

              this.addUniqueImage(file.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl: file.localHeroImages[l],
                imageRes: url.imageDimensions(file.localHeroImages[l]),
                loadStatus: 'done'
              },'hero')
            }
            for (let l = 0; l < file.localLogoImages.length; l++) {

              this.addUniqueImage(file.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl: file.localLogoImages[l],
                imageRes: url.imageDimensions(file.localLogoImages[l]),
                loadStatus: 'done'
              },'logo')
            }
            for (let l = 0; l < file.localIcons.length; l++) {

              this.addUniqueImage(file.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl: file.localIcons[l],
                imageRes: url.imageDimensions(file.localIcons[l]),
                loadStatus: 'done'
              },'icon')
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
        if(imageType=="long") {
          imageKeys = Object.keys(this.appImages);
        } else if (imageType=="tall"){
          imageKeys = Object.keys(this.appTallImages);
        } else if (imageType=="hero"){
          imageKeys = Object.keys(this.appHeroImages);
        } else if (imageType=="logo"){
          imageKeys = Object.keys(this.appLogoImages);
        } else if (imageType=="icon"){
          imageKeys = Object.keys(this.appIcons);
        }

      }

      for (let i = 0; i < imageKeys.length; i++) {
        let image: ImagesStatusAndContent;
        if(imageType=="long") {
          image = this.appImages[imageKeys[i]];
        } else if (imageType=="tall") {
          image = this.appTallImages[imageKeys[i]];
        } else if (imageType=="hero") {
          image = this.appHeroImages[imageKeys[i]];
        } else if (imageType=="logo") {
          image = this.appLogoImages[imageKeys[i]];
        } else if (imageType=="icon") {
          image = this.appIcons[imageKeys[i]];
        }
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
    if (imageType === 'long') {
      return this.appImages[imageKey].content.findIndex((item) => item.imageUrl === imageUrl) === -1;
    } else if (imageType === 'tall') {
      return this.appTallImages[imageKey].content.findIndex((item) => item.imageUrl ===imageUrl) === -1;
    } else if (imageType === 'hero') {
      return this.appHeroImages[imageKey].content.findIndex((item) => item.imageUrl ===imageUrl) === -1;
    } else if (imageType === 'logo') {
      return this.appLogoImages[imageKey].content.findIndex((item) => item.imageUrl ===imageUrl) === -1;
    } else if (imageType === 'icon') {
      return this.appIcons[imageKey].content.findIndex((item) => item.imageUrl ===imageUrl) === -1;
    }
  }

  addUniqueImage(imageKey: string, content: ImageContent, imageType: string) {
    if (this.isImageUnique(imageKey, content.imageUrl, imageType)) {
      if (imageType === 'long') {
        this.appImages[imageKey].content.push(content);
        return this.appImages[imageKey].content[this.appImages[imageKey].content.length - 1];
      } else if (imageType === 'tall') {
        this.appTallImages[imageKey].content.push(content);
        return this.appTallImages[imageKey].content[this.appTallImages[imageKey].content.length - 1];
      } else if (imageType === 'hero') {
        this.appHeroImages[imageKey].content.push(content);
        return this.appHeroImages[imageKey].content[this.appHeroImages[imageKey].content.length - 1];
      } else if (imageType === 'logo') {
        this.appLogoImages[imageKey].content.push(content);
        return this.appLogoImages[imageKey].content[this.appLogoImages[imageKey].content.length - 1];
      } else if (imageType === 'icon') {
        this.appIcons[imageKey].content.push(content);
        return this.appIcons[imageKey].content[this.appIcons[imageKey].content.length - 1];
      }


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

    const dialog = require('electron').remote.dialog;
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
            for (const appId in this.previewData[directory][userId].apps) {
              appsCount++;
            }
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
              const selection: AppSelection = {
                title: app.extractedTitle,
                images: {
                  grid: appImage.getCurrentImage(app.images, this.appImages) ? {
                    pool: app.images.imagePool,
                    filename: await saveImage(appImage.getCurrentImage(app.images, this.appImages).imageUrl, packagePath, `${app.extractedTitle}.grid`)
                  }: null,
                  poster: appImage.getCurrentImage(app.tallimages, this.appTallImages) ? {
                    pool: app.tallimages.imagePool,
                    filename: await saveImage(appImage.getCurrentImage(app.tallimages, this.appTallImages).imageUrl, packagePath, `${app.extractedTitle}.poster`)
                  }: null,
                  hero: appImage.getCurrentImage(app.heroimages, this.appHeroImages) ? {
                    pool: app.heroimages.imagePool,
                    filename: await saveImage(appImage.getCurrentImage(app.heroimages, this.appHeroImages).imageUrl, packagePath, `${app.extractedTitle}.hero`)
                  } : null,
                  logo: appImage.getCurrentImage(app.logoimages, this.appLogoImages) ? {
                    pool: app.logoimages.imagePool,
                    filename: await saveImage(appImage.getCurrentImage(app.logoimages, this.appLogoImages).imageUrl, packagePath, `${app.extractedTitle}.logo`)
                  } : null,
                  icon: appImage.getCurrentImage(app.icons,this.appIcons) ? {
                    pool: app.icons.imagePool,
                    filename: await saveImage(appImage.getCurrentImage(app.icons, this.appIcons).imageUrl, packagePath, `${app.extractedTitle}.icon`)
                  } : null
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

    const dialog = require('electron').remote.dialog;
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
          if(selection.images.grid) {
            this.addUniqueImage(selection.images.grid.pool, {
              imageProvider: 'LocalStorage',
              imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images.grid.filename}`),
              loadStatus: 'done'
            }, 'long');

          }
          if(selection.images.poster) {
            this.addUniqueImage(selection.images.poster.pool, {
              imageProvider: 'LocalStorage',
              imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images.poster.filename}`),
              loadStatus: 'done'
            }, 'tall');

          }
          if(selection.images.hero) {
            this.addUniqueImage(selection.images.hero.pool, {
              imageProvider: 'LocalStorage',
              imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images.hero.filename}`),
              loadStatus: 'done'
            }, 'hero');

          }
          if(selection.images.logo) {
            this.addUniqueImage(selection.images.logo.pool, {
              imageProvider: 'LocalStorage',
              imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images.logo.filename}`),
              loadStatus: 'done'
            }, 'logo');

          }
          if(selection.images.icon) {
            this.addUniqueImage(selection.images.icon.pool, {
              imageProvider: 'LocalStorage',
              imageUrl: url.encodeFile(`${packagePath}${path.sep}${selection.images.icon.filename}`),
              loadStatus: 'done'
            }, 'icon');

          }

          importedApps.push(selection.title);
        }

        for (const directory in this.previewData) {
          for (const userId in this.previewData[directory]) {
            for (const appId in this.previewData[directory][userId].apps) {
              const app: PreviewDataApp = this.previewData[directory][userId].apps[appId];
              if (importedApps.includes(app.extractedTitle)) {
                this.setImageIndex(app, this.getTotalLengthOfImages(app, 'long', true) - 1, 'long', true);
                this.setImageIndex(app, this.getTotalLengthOfImages(app, 'tall', true) - 1, 'tall', true);
                this.setImageIndex(app, this.getTotalLengthOfImages(app, 'hero', true) - 1, 'hero', true);
                this.setImageIndex(app, this.getTotalLengthOfImages(app, 'logo', true) - 1, 'logo', true);
                this.setImageIndex(app, this.getTotalLengthOfImages(app, 'icon', true) - 1, 'icon', true);
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
