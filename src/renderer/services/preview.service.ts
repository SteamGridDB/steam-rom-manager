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
  SteamTree, userAccountData
} from '../../models';
import { VDF_Manager, VDF_Error, CategoryManager } from "../../lib";
import { APP } from '../../variables';
import { queue } from 'async';
import * as steam from "../../lib/helpers/steam";
import * as url from "../../lib/helpers/url";
import * as appImage from "../../lib/helpers/app-image";
import * as ids from '../../lib/helpers/steam';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
/*import * as CalipersFactory from 'calipers';
import * as calipers_png from 'calipers-png';
import * as calipers_jpeg from 'calipers-jpeg';
var Calipers = CalipersFactory(calipers_png,calipers_jpeg);*/
import * as probe from 'probe-image-size';
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
    this.imageTypes = ["long","tall", "hero","logo"];
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
    /* if (fromSteam) {
            if (this.appSettings.knownSteamDirectories.length === 0) {
                this.previewVariables.listIsBeingGenerated = false;
                this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 });
            }
            else
                this.generatePreviewDataFromSteamCallback();
        }
        else */
    this.generatePreviewDataCallback();
  }

  saveData(remove: boolean): Promise<any> {

    if (this.previewVariables.listIsBeingSaved)
    return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingSaved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    else if (!remove && this.previewVariables.numberOfListItems === 0)
    return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    else if (this.previewVariables.listIsBeingRemoved)
    return Promise.resolve().then(() => { this.loggerService.info(this.lang.info.listIsBeingRemoved, { invokeAlert: true, alertTimeout: 3000 }); return false; });
    else if (remove && this.appSettings.knownSteamDirectories.length === 0)
    return Promise.resolve().then(() => { this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, { invokeAlert: true, alertTimeout: 3000 }); return false; });

    let vdfManager = new VDF_Manager();
    let categoryManager = new CategoryManager();

    this.previewVariables.listIsBeingSaved = true;
    this.loggerService.info(this.lang.info.populatingVDF_List, { invokeAlert: true, alertTimeout: 3000 });
    return vdfManager.prepare(remove ? this.appSettings.knownSteamDirectories : this.previewData).then((error) => {
      if (error) {

        this.loggerService.error(this.lang.errors.populatingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      }
      this.loggerService.info(this.lang.info.creatingBackups, { invokeAlert: true, alertTimeout: 3000 });

      return vdfManager.backup();
    }).then(() => {
      this.loggerService.info(this.lang.info.readingVDF_Files, { invokeAlert: true, alertTimeout: 3000 });

      return vdfManager.read();
    }).then(() => {
      if (!remove) {
        this.loggerService.info(this.lang.info.mergingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });

        return vdfManager.mergeData(this.previewData, this.appImages, this.appTallImages, this.appHeroImages, this.appLogoImages);
      }
      else {
        this.loggerService.info(this.lang.info.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });

        return vdfManager.removeAllAddedEntries();
      }
    }).then(() => {
      this.loggerService.info(this.lang.info.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });

      return vdfManager.write();
    }).then((error) => {
      if (error) {
        this.loggerService.error(this.lang.errors.savingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      }
      this.loggerService.success(this.lang.info.updatingKnownSteamDirList, { invokeAlert: true, alertTimeout: 3000 });

      if (!remove) {
        let settings = this.settingsService.getSettings();
        settings.knownSteamDirectories = _.union(settings.knownSteamDirectories, Object.keys(this.previewData));
        this.settingsService.settingsChanged();
      }
    }).then(() => {
      this.loggerService.success(this.lang.success.writingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
      this.previewVariables.listIsBeingSaved = false;

      if (remove) {
        this.loggerService.success(this.lang.success.removingVDF_entries, { invokeAlert: true, alertTimeout: 3000 });
        this.clearPreviewData();
      }

    }).then(()=>{
      return categoryManager.save(this.previewData).then(()=>{
        return true;
      }).catch((error) => {
        if (error) {
          if (error.type === 'OpenError') {
            this.loggerService.error('Cannot import while Steam is running. Close Steam and try again.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
          } else {
            this.loggerService.error('Error saving categories', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
          }
        }
        return false;
      });
    }).catch((fatalError) => {
      this.loggerService.error(this.lang.errors.fatalError, { invokeAlert: true, alertTimeout: 3000 });
      if (fatalError)
        this.loggerService.error(fatalError);
      this.previewVariables.listIsBeingSaved = false;
      return false;
    });
  }

  loadImage(app: PreviewDataApp) {
    if (app) {
      let image: ImageContent;
      if (this.currentImageType==='long') {
        image = appImage.getCurrentImage(app.images, this.appImages);
      } else if (this.currentImageType === 'tall') {
        image = appImage.getCurrentImage(app.tallimages, this.appTallImages);
      } else if (this.currentImageType === 'hero') {
        image = appImage.getCurrentImage(app.heroimages, this.appHeroImages);
      } else if (this.currentImageType === 'logo') {
        image = appImage.getCurrentImage(app.logoimages, this.appLogoImages);
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
          console.log(this)
          image.loadStatus = 'done';
          image.imageRes = `${imageLoader.width}x${imageLoader.height}`
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
        image.imageRes = `${imageLoader.width}x${imageLoader.height}`;
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
  }

  setImageIndex(app: PreviewDataApp, index: number) {
    if (app) {
      if (this.currentImageType === 'long') {
        appImage.setImageIndex(app.images, this.appImages, index);
      } else if (this.currentImageType === 'tall') {
        appImage.setImageIndex(app.tallimages, this.appTallImages, index);
      } else if (this.currentImageType === 'hero') {
        appImage.setImageIndex(app.heroimages, this.appHeroImages, index);
      } else if (this.currentImageType === 'logo') {
        appImage.setImageIndex(app.logoimages, this.appLogoImages, index);
      }

      this.previewDataChanged.next();
    }
  }

  areImagesAvailable(app: PreviewDataApp) {
    return this.getTotalLengthOfImages(app) > 0;
  }

  getTotalLengthOfImages(app: PreviewDataApp) {
    if (app)
      if (this.currentImageType === 'long') {
        return appImage.getMaxLength(app.images, this.appImages);
      } else if (this.currentImageType === 'tall') {
        return appImage.getMaxLength(app.tallimages, this.appTallImages);
      } else if (this.currentImageType === 'hero') {
        return appImage.getMaxLength(app.heroimages, this.appHeroImages);
      } else if (this.currentImageType === 'logo') {
        return appImage.getMaxLength(app.logoimages, this.appLogoImages);
      }
    else
      return 0;
  }

  getCurrentImage(app: PreviewDataApp) {
    if (this.currentImageType === 'long') {
      return appImage.getCurrentImage(app.images, this.appImages);
    } else if (this.currentImageType === 'tall') {
      return appImage.getCurrentImage(app.tallimages, this.appTallImages);
    } else if (this.currentImageType === 'hero') {
      return appImage.getCurrentImage(app.heroimages, this.appHeroImages);
    } else if (this.currentImageType === 'logo') {
      return appImage.getCurrentImage(app.logoimages, this.appLogoImages);
    }

  }

  setIconIndex(app: PreviewDataApp, index: number) {
    if (app && app.icons.length) {
      app.currentIconIndex = index < 0 ? app.icons.length - 1 : (index < app.icons.length ? index : 0);
      this.previewDataChanged.next();
    }
  }

  get images() {
    if (this.currentImageType === 'long') {
      return this.appImages;
    } else if (this.currentImageType === 'tall') {
      return this.appTallImages;
    } else if (this.currentImageType === 'hero') {
      return this.appHeroImages;
    } else if (this.currentImageType === 'logo') {
      return this.appLogoImages;
    }
  }

  clearPreviewData() {
    this.previewData = undefined;
    this.clearImageCache(true);
    this.previewVariables.numberOfListItems = 0;
    this.previewDataChanged.next();
  }

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

  /* private generatePreviewDataFromSteamCallback() {
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
    } */

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
            let executableLocation = (config.appendArgsToExecutable ? `${file.modifiedExecutableLocation} ${file.argumentString}` : `${file.modifiedExecutableLocation}`).trim();
            let appID = steam.generateAppId(executableLocation, file.finalTitle);
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
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appImages[file.imagePool].searchQueries;
              let currentProviders = this.appImages[file.imagePool].defaultImageProviders;

              this.appImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appTallImages[file.imagePool] === undefined) {
              this.appTallImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appTallImages[file.imagePool].searchQueries;
              let currentProviders = this.appTallImages[file.imagePool].defaultImageProviders;

              this.appTallImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appTallImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appHeroImages[file.imagePool] === undefined) {
              this.appHeroImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appHeroImages[file.imagePool].searchQueries;
              let currentProviders = this.appHeroImages[file.imagePool].defaultImageProviders;

              this.appHeroImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appHeroImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }
            if (this.appLogoImages[file.imagePool] === undefined) {
              this.appLogoImages[file.imagePool] = {
                retrieving: false,
                searchQueries: file.onlineImageQueries,
                defaultImageProviders: config.imageProviders,
                content: []
              };
            }
            else {
              let currentQueries = this.appLogoImages[file.imagePool].searchQueries;
              let currentProviders = this.appLogoImages[file.imagePool].defaultImageProviders;

              this.appLogoImages[file.imagePool].searchQueries = _.union(currentQueries, file.onlineImageQueries);
              this.appLogoImages[file.imagePool].defaultImageProviders = _.union(currentProviders, config.imageProviders);
            }


            if (previewData[config.steamDirectory][userAccount.accountID].apps[appID] === undefined) {
              let steamImage = gridData[config.steamDirectory][userAccount.accountID][appID];
              let steamTallImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('p')];
              let steamHeroImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('_hero')];
              let steamLogoImage = gridData[config.steamDirectory][userAccount.accountID][ids.shortenAppId(appID).concat('_logo')];
              let steamImageUrl = steamImage ? url.encodeFile(steamImage) : undefined;
              let steamTallImageUrl = steamTallImage ? url.encodeFile(steamTallImage) : undefined;
              let steamHeroImageUrl = steamHeroImage ? url.encodeFile(steamHeroImage) : undefined;
              let steamLogoImageUrl = steamLogoImage ? url.encodeFile(steamLogoImage) : undefined;

              let currentIconIndex = oldDataApp !== undefined ? oldDataApp.currentIconIndex : 0;

              if (0 > currentIconIndex || currentIconIndex > file.localIcons.length)
                currentIconIndex = 0;

              previewData[config.steamDirectory][userAccount.accountID].apps[appID] = {
                entryId: numberOfItems++,
                status: 'add', //TODO: change to this when "mark" feature is implemented: oldDataApp !== undefined ? oldDataApp.status : 'add',
                configurationTitle: config.configurationTitle,
                steamCategories: file.steamCategories,
                startInDirectory: file.startInDirectory,
                imageProviders: config.imageProviders,
                argumentString: config.appendArgsToExecutable ? '' : file.argumentString,
                title: file.finalTitle,
                images: {
                  steam: steamImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamImageUrl,
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultImage,
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                tallimages: {
                  steam: steamTallImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamTallImageUrl,
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultTallImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultTallImage,
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                heroimages: {
                  steam: steamHeroImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamHeroImageUrl,
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultHeroImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultHeroImage,
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                logoimages: {
                  steam: steamLogoImage ? {
                    imageProvider: 'Steam',
                    imageUrl: steamLogoImageUrl,
                    loadStatus: 'done'
                  } : undefined,
                  default: file.defaultLogoImage ? {
                    imageProvider: 'LocalStorage',
                    imageUrl: file.defaultLogoImage,
                    loadStatus: 'done'
                  } : undefined,
                  imagePool: file.imagePool,
                  imageIndex: 0
                },
                executableLocation,
                currentIconIndex,
                icons: file.localIcons
              };
            }
            else {
              let currentCategories = previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories;
              previewData[config.steamDirectory][userAccount.accountID].apps[appID].steamCategories = _.union(currentCategories, file.steamCategories);
            }

            for (let l = 0; l < file.localImages.length; l++) {
              probe(fs.createReadStream(file.localImages[l].split(":")[1])).then((result: any)=>{
                this.addUniqueImage(file.imagePool, {
                  imageProvider: 'LocalStorage',
                  imageUrl: file.localImages[l],
                  imageRes: `${result.width}x${result.height}`,
                  loadStatus: 'done'
                },'long')
              })

            }
            for (let l = 0; l < file.localTallImages.length; l++) {
              probe(fs.createReadStream(file.localTallImages[l].split(":")[1])).then((result: any)=>{
                this.addUniqueImage(file.imagePool, {
                  imageProvider: 'LocalStorage',
                  imageUrl: file.localTallImages[l],
                  imageRes: `${result.width}x${result.height}`,
                  loadStatus: 'done'
                },'tall')

              })
            }
            for (let l = 0; l < file.localHeroImages.length; l++) {

              probe(fs.createReadStream(file.localHeroImages[l].split(":")[1])).then((result: any)=>{
                this.addUniqueImage(file.imagePool, {
                  imageProvider: 'LocalStorage',
                  imageUrl: file.localHeroImages[l],
                  imageRes: `${result.width}x${result.height}`,
                  loadStatus: 'done'
                },'hero')

              })
            }
            for (let l = 0; l < file.localLogoImages.length; l++) {

              probe(fs.createReadStream(file.localLogoImages[l].split(":")[1])).then((result: any)=>{
                this.addUniqueImage(file.imagePool, {
                  imageProvider: 'LocalStorage',
                  imageUrl: file.localLogoImages[l],
                  imageRes: `${result.width}x${result.height}`,
                  loadStatus: 'done'
                },'logo')

              })

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
              this.imageProviderService.instance.retrieveUrls(image.searchQueries[j], imageType,  imageProvidersForKey, <K extends keyof ProviderCallbackEventMap>(event: K, data: ProviderCallbackEventMap[K]) => {
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
      }

    }
    return null;
  }
}
