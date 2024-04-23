import { VDF_ListData,
  SteamDirectory,
  PreviewData,
  PreviewDataApp,
  AppImages,
  VDF_ListItem,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
  VDF_ScreenshotsOutcome,
  VDF_AllScreenshotsOutcomes
} from "../models";
import { artworkTypes, artworkIdDict } from './artwork-types';
import { superTypes, ArtworkOnlyType } from './parsers/available-parsers';
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as vdf from './helpers/vdf';
import * as appImage from './helpers/app-image';
import * as steam from './helpers/steam';
import * as _ from 'lodash';
import * as path from 'path';
import { merge, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ArtworkCache } from ".";


export class VDF_Manager {
  private data: VDF_ListData = {};
  private artworkCache: ArtworkCache;

  constructor() {
    this.artworkCache = new ArtworkCache();
  }

  private get lang() {
    return APP.lang.vdfManager;
  }

  get vdfData() {
    return this.data;
  }

  prepare(data: SteamDirectory[] | PreviewData) {
    return new Promise<void>((resolve, reject)=>{
      let chain: Promise<any> = Promise.resolve(data);
      if (data instanceof Array) {
        if (data.length > 0) {
          chain = chain.then((data: SteamDirectory[] | PreviewData)=>vdf.generateListFromDirectoryList(data as SteamDirectory[]))
        } else {
          reject(new VDF_Error(this.lang.error.emptyDirectoryList));
        }
      } else {
        chain = chain.then(vdf.generateListFromPreviewData)
      }
      return chain.then((generatedData)=>{
        if (generatedData.numberOfGeneratedEntries > 0) {
          if (generatedData.errors.length > 0) {
            reject(new VDF_Error(generatedData.errors))
          } else {
            this.data = generatedData.data;
            resolve();
          }
        } else {
          if (generatedData.errors.length > 0) {
            reject(new VDF_Error(generatedData.errors))
          } else {
            reject(new VDF_Error(this.lang.error.noUsersFound));
          }
        }
      }).catch((error) => {
        reject(new VDF_Error(this.lang.error.couldNotPrepareToRead__i.interpolate({ error })));
      });
    })
  }

  getBatchProgress() {
    let updates: Observable<{update: string, batch: number}>[] = [];
    for(let steamDirectory in this.data) {
      for(let userId in this.data[steamDirectory]) {
        updates.push(
          this.data[steamDirectory][userId].screenshots.getBatchProgress()
          .pipe(map((b: {batch: number, total: number}) => {
            return {update: `Doing batch (${b.batch + 1}/${b.total}) for user ${userId}`, batch: b.batch}
          }))
        )
      }
    }
    return merge(...updates);
  }

  backup(options?: { shortcuts?: boolean, screenshots?: boolean }) {
    return new Promise<void>((resolve,reject)=>{
      let promises: Promise<void>[] = []
      let backupShortcuts = options !== undefined ? options.shortcuts : true;
      let backupScreenshots = options !== undefined ? options.screenshots : true;

      for (let steamDirectory in this.data) {
        for (let userId in this.data[steamDirectory]) {
          if (backupShortcuts) {
            promises.push(this.data[steamDirectory][userId].shortcuts.backup('backup', true));
            promises.push(this.data[steamDirectory][userId].shortcuts.backup('firstbackup'));
          }
          if (backupScreenshots) {
            promises.push(this.data[steamDirectory][userId].screenshots.backup('backup', true));
            promises.push(this.data[steamDirectory][userId].screenshots.backup('firstbackup'));
          }
        }
      }

      return Promise.all(promises)
      .then(()=>resolve())
      .catch((error)=>reject(this.lang.error.couldNotBackupEntries__i.interpolate({ error })));
    })
  }

  read(options?: { shortcuts?: { skipIndexing: boolean, read: boolean }, addedItems?: boolean, screenshots?: boolean }) {
    return new Promise<void>((resolve,reject)=>{
      let promises: Promise<any>[] = [];
      let readShortcuts = _.get(options, 'shortcuts.read', true);
      let skipIndexing = _.get(options, 'shortcuts.skipIndexing', false);
      let readAddedItems = _.get(options, 'addedItems', true);
      let readScreenshots = _.get(options, 'screenshots', true);
      

      for (let steamDirectory in this.data) {
        for (let userId in this.data[steamDirectory]) {
          if (readShortcuts)
            promises.push(this.data[steamDirectory][userId].shortcuts.read(skipIndexing));
          if (readAddedItems)
            promises.push(this.data[steamDirectory][userId].addedItems.read());
          if (readScreenshots)
            promises.push(this.data[steamDirectory][userId].screenshots.read());
        }
      }
      Promise.all(promises)
      .then(() => this.artworkCache.read())
      .then(()=>resolve())
      .catch((error) => {
        reject(this.lang.error.couldNotReadEntries__i.interpolate({ error }));
      });
    })
  }

  write(batch: boolean, batchSize?: number, options?: { shortcuts?: boolean, addedItems?: boolean, screenshots?: boolean}) {
    return new Promise<{nonFatal: VDF_Error, outcomes: VDF_AllScreenshotsOutcomes}>((resolve,reject)=>{
      let shortcutPromises: Promise<void>[] = [];
      let addedItemsPromises: Promise<void>[] = [];
      let screenshotPromises: Promise<VDF_Error>[] = [];
      let writeShortcuts = options ? options.shortcuts : true;
      let writeAddedItems = options ? options.addedItems : true;
      let writeScreenshots = options ? options.screenshots : true;
      let screenshotsOutcomes: VDF_AllScreenshotsOutcomes = {};
      for (let steamDirectory in this.data) {
        screenshotsOutcomes[steamDirectory] = {};
        for (let userId in this.data[steamDirectory]) {
          if (writeShortcuts) {
            shortcutPromises.push(this.data[steamDirectory][userId].shortcuts.write());
          }
          if (writeAddedItems) {
            addedItemsPromises.push(this.data[steamDirectory][userId].addedItems.write());
          }
          if (writeScreenshots) {
            screenshotPromises.push(this.data[steamDirectory][userId].screenshots.write(batch, batchSize).then((outcome: VDF_ScreenshotsOutcome)=>{
              screenshotsOutcomes[steamDirectory][userId] = outcome;
              return outcome.error
            }))
          }
        }
      }
      this.artworkCache.write()
      .then(()=>Promise.all(shortcutPromises))
      .then(()=>Promise.all(addedItemsPromises))
      .then(()=>Promise.all(screenshotPromises))
      .then((errors: VDF_Error[]) => {
        const realErrors = errors.filter(e=>!!e)
        resolve({
          nonFatal: realErrors.length ? new VDF_Error(realErrors, this.lang.error.nonFatal, true) : undefined,
          outcomes: screenshotsOutcomes
        })
      }).catch((error: any)=>{
        reject(new VDF_Error(error, this.lang.error.couldNotWriteEntries));
      })
    });
  }

  forEach(callback: (steamDirectory: string, userId: string, listItem: VDF_ListItem) => void) {
    for (let steamDirectory in this.data) {
      for (let userId in this.data[steamDirectory]) {
        callback(steamDirectory, userId, this.data[steamDirectory][userId]);
      }
    }
  }

  mergeData(previewData: PreviewData, images: AppImages, deleteDisabledShortcuts: boolean) {
    return new Promise<{extraneousAppIds: VDF_ExtraneousItemsData, addedCategories: VDF_AddedCategoriesData}>((resolve, reject) => {
      Promise.resolve().then(()=>{
        let extraneousAppIds: VDF_ExtraneousItemsData = {};
        let addedCategories: VDF_AddedCategoriesData = {};
        this.forEach((steamDirectory, userId, listItem) => {
          if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid)
            return;
          let apps = previewData[steamDirectory][userId].apps;
          let currentAppIds = Object.entries(previewData[steamDirectory][userId].apps).map(([appId, app]: [appId: string, app: PreviewDataApp]) => {
            if(app.changedId) {
              return app.changedId
            } else {
              return appId
            }
          });
          let enabledParsers = Array.from(new Set(currentAppIds.map((appid:string)=> {
            if(apps[appid]) {
              return apps[appid].parserId
            } else {
              return Object.values(apps).filter((app: PreviewDataApp)=>app.changedId==appid)[0].parserId
            }
          })));
          const addedApps = listItem.addedItems.data.addedApps;
          let addedAppIds = Object.keys(addedApps);
          if(!deleteDisabledShortcuts) {
            addedAppIds = addedAppIds.filter((appid:string) => enabledParsers.includes(addedApps[appid].parserId));
          }
          if(!extraneousAppIds[steamDirectory]) {
            extraneousAppIds[steamDirectory] = {}
          }
          extraneousAppIds[steamDirectory][userId] = addedAppIds.filter((appid:string) => !currentAppIds.includes(appid));
          listItem.screenshots.extraneous = extraneousAppIds[steamDirectory][userId];
          listItem.shortcuts.extraneous = extraneousAppIds[steamDirectory][userId];
          if(!addedCategories[steamDirectory]) {
            addedCategories[steamDirectory] = {}
          }
          addedCategories[steamDirectory][userId] = Object.fromEntries(addedAppIds.map(appId => [steam.shortenAppId(appId), addedApps[appId].categories]))
          for (let appId in apps) {
            let app = apps[appId];
            if (app.status === 'add') {
              if (app.changedId) {
                appId = app.changedId;
              }
              let item = listItem.shortcuts.getItem(appId);
              const artworkOnly = superTypes[ArtworkOnlyType].includes(app.parserType);
              listItem.addedItems.addItem(appId, app.parserId, artworkOnly, app.steamCategories);
              for(const artworkType of artworkTypes) {
                const currentImage = appImage.getCurrentImage(app.images[artworkType], images[artworkType]);
                if(currentImage !== undefined && currentImage.imageProvider !== 'Steam') {
                  listItem.screenshots.addItem({
                    appId: steam.shortenAppId(appId).concat(artworkIdDict[artworkType]),
                    title: app.title,
                    url: currentImage.imageUrl,
                    artworkType: artworkType,
                    sgdbId: currentImage.imageGameId,
                    drmProtect: app.drmProtect
                  });
                }
                // artwork Cache is shared across steam users and steam directories
                if(currentImage !== undefined && currentImage.imageProvider == 'SteamGridDB') {
                  this.artworkCache.cacheArtwork(currentImage.imageGameId, currentImage.imageArtworkId, appId, artworkType)
                }
                // special handling for icon path being added to shortcuts.vdf
                if(artworkType === 'icon') {
                  let icon_path: string = "";
                  if(currentImage !== undefined) {
                    let icon_ext: string = currentImage.imageUrl.split('.').slice(-1)[0];
                    icon_ext = steam.map_ext[""+icon_ext] || icon_ext;
                    icon_path = path.join(listItem.screenshots.gridDir, `${steam.shortenAppId(appId).concat('_icon')}.${icon_ext}`);
                  }
                  if (!artworkOnly && item !== undefined) {
                    item.appid = steam.generateShortcutId(app.executableLocation, app.title),
                    item.appname = app.title;
                    item.exe = app.executableLocation;
                    item.StartDir = app.startInDirectory;
                    item.LaunchOptions = app.argumentString;
                    item.icon = icon_path;
                    item.tags = _.union(app.steamCategories, item.tags);
                  }
                  else if(!artworkOnly) {
                    listItem.shortcuts.addItem(appId, {
                      appid: steam.generateShortcutId(app.executableLocation, app.title),
                      appname: app.title,
                      exe: app.executableLocation,
                      StartDir: app.startInDirectory,
                      LaunchOptions: app.argumentString,
                      icon: icon_path,
                      tags: app.steamCategories
                    });
                  }
                }
              }
            }
            else if (app.status === 'remove') {
              if(!addedApps[appId] || !addedApps[appId].artworkOnly) {
                extraneousAppIds[steamDirectory][userId].push(appId);
              }
              listItem.shortcuts.removeItem(appId);
              listItem.addedItems.removeItem(appId);
              for(const artworkType of artworkTypes) {
                listItem.screenshots.removeItem(steam.shortenAppId(appId).concat(artworkIdDict[artworkType]));
              }
              listItem.screenshots.removeItem(appId);
              app.images.steam = undefined
            }
          }
        });
        resolve({extraneousAppIds: extraneousAppIds, addedCategories: addedCategories})
      }).catch((error: Error) => {
        reject(new VDF_Error(this.lang.error.couldNotMergeEntries__i.interpolate({ error })));
      });
    })
  }

  removeAllAddedEntries() {
    return new Promise<{extraneousAppIds: VDF_ExtraneousItemsData,addedCategories: VDF_AddedCategoriesData}>((resolve,reject)=>{
      Promise.resolve().then(()=>{
        let extraneousAppIds: VDF_ExtraneousItemsData = {}
        this.forEach((steamDirectory, userId, listItem) => {
          const addedApps = listItem.addedItems.data.addedApps;
          if(!extraneousAppIds[steamDirectory]) {
            extraneousAppIds[steamDirectory] = {}
          }
          extraneousAppIds[steamDirectory][userId] = Object.keys(addedApps).filter((appId) => !addedApps[appId].artworkOnly);
          if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid) {
            return;
          }
          for (const appId in addedApps) {
            listItem.shortcuts.removeItem(appId);
            listItem.screenshots.removeItem(appId);
            for(let artworkType of artworkTypes) {
              listItem.screenshots.removeItem(steam.shortenAppId(appId).concat(artworkIdDict[artworkType]))
            }
          }
          listItem.addedItems.clear();
        });
        resolve({extraneousAppIds: extraneousAppIds, addedCategories: undefined});
      }).catch((error: Error) => {
        reject(new VDF_Error(this.lang.error.couldNotRemoveEntries__i.interpolate({ error })));
      });
    })
  }
}
