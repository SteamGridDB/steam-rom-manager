import { VDF_ListData,
  SteamDirectory,
  PreviewData,
  PreviewDataApp,
  AppImages,
  VDF_ListItem,
  VDF_ExtraneousItemsData,
  VDF_ScreenshotsOutcome,
  VDF_AllScreenshotsOutcomes
} from "../models";
import { artworkTypes, artworkIdDict } from './artwork-types';
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as vdf from './helpers/vdf';
import * as appImage from './helpers/app-image';
import * as ids from './helpers/steam';
import * as _ from 'lodash';
import * as path from 'path';
import { merge, Observable } from "rxjs";
import { map } from "rxjs/operators";

export class VDF_Manager {
  private data: VDF_ListData = {};

  private get lang() {
    return APP.lang.vdfManager;
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
          .pipe(map(i=>{ return {update: `Doing batch ${i+1} for user ${userId}`, batch: i}}))
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
        .then(()=>resolve())
        .catch((error) => {
          reject(this.lang.error.couldNotReadEntries__i.interpolate({ error }));
        });
    })
  }

  write(batch: boolean, options?: { shortcuts?: boolean, addedItems?: boolean, screenshots?: boolean }) {
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
            screenshotPromises.push(this.data[steamDirectory][userId].screenshots.write(batch).then((outcome: VDF_ScreenshotsOutcome)=>{
              screenshotsOutcomes[steamDirectory][userId] = outcome;
              return outcome.error
            }))
          }
        }
      }

      Promise.all(shortcutPromises)
      .then(()=>Promise.all(addedItemsPromises))
      .then(()=>Promise.all(screenshotPromises))
      .then((errors: VDF_Error[]) => {
        const realErrors = errors.filter(e=>!!e)
        resolve({
          nonFatal: realErrors.length ? new VDF_Error(realErrors, this.lang.error.nonFatal, true) : undefined,
          outcomes: screenshotsOutcomes
        })
      }).catch((error)=>{
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

  mergeData(previewData: PreviewData, images: {[artworkType: string]: AppImages}, deleteDisabledShortcuts: boolean) {
    return new Promise<VDF_ExtraneousItemsData>((resolve, reject) => {
      Promise.resolve().then(()=>{
        let extraneousAppIds: VDF_ExtraneousItemsData = {};
        this.forEach((steamDirectory, userId, listItem) => {
          if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid)
            return;
          let apps = previewData[steamDirectory][userId].apps;
          let currentAppIds = Object.keys(previewData[steamDirectory][userId].apps)
          let enabledParsers = Array.from(new Set(currentAppIds.map((appid:string)=> apps[appid].parserId)));
          let addedAppIds = Object.keys(listItem.addedItems.data);
          if(!deleteDisabledShortcuts) {
            addedAppIds = addedAppIds.filter((appid:string) => listItem.addedItems.data[appid]==='-legacy-' || enabledParsers.indexOf(listItem.addedItems.data[appid])>=0);
          }
          extraneousAppIds[userId] = addedAppIds.filter((appid:string) => currentAppIds.indexOf(appid)<0);
          listItem.screenshots.extraneous = extraneousAppIds[userId];
          listItem.shortcuts.extraneous = extraneousAppIds[userId];
          for (let appId in apps) {
            let app = apps[appId];
            if (app.status === 'add') {
              let item = listItem.shortcuts.getItem(appId);
              listItem.addedItems.addItem(appId, app.parserId);
              for(const artworkType of artworkTypes) {
                const currentImage = appImage.getCurrentImage(app.images[artworkType], images[artworkType]);
                if(currentImage !== undefined && currentImage.imageProvider !== 'Steam') {
                  listItem.screenshots.addItem({
                    appId: ids.shortenAppId(appId).concat(artworkIdDict[artworkType]),
                    title: app.title,
                    url: currentImage.imageUrl
                  });
                }
                // special handling for icon path being added to shortcuts.vdf
                if(artworkType === 'icon') {
                  let icon_path: string = "";
                  if(currentImage !== undefined) {
                    let icon_ext: string = currentImage.imageUrl.split('.').slice(-1)[0];
                    icon_ext = ids.map_ext[""+icon_ext] || icon_ext;
                    icon_path = path.join(listItem.screenshots.gridDir, `${ids.shortenAppId(appId).concat('_icon')}.${icon_ext}`);
                  }
                  if (app.parserType!== 'Steam' && item !== undefined) {
                    item.appid = ids.generateShortcutId(app.executableLocation, app.title),
                    item.appname = app.title;
                    item.exe = app.executableLocation;
                    item.StartDir = app.startInDirectory;
                    item.LaunchOptions = app.argumentString;
                    item.icon = icon_path;
                    item.tags = _.union(app.steamCategories, item.tags);
                  }
                  else if(app.parserType !== 'Steam') {
                    listItem.shortcuts.addItem(appId, {
                      appid: ids.generateShortcutId(app.executableLocation, app.title),
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
              extraneousAppIds[userId].push(appId);
              listItem.shortcuts.removeItem(appId);
              listItem.addedItems.removeItem(appId);
              for(const artworkType of artworkTypes) {
                listItem.screenshots.removeItem(ids.shortenAppId(appId).concat(artworkIdDict[artworkType]));
              }
              listItem.screenshots.removeItem(appId);
              app.images.steam = undefined
            }
          }
        });
        resolve(extraneousAppIds)
      }).catch((error: Error) => {
        reject(new VDF_Error(this.lang.error.couldNotMergeEntries__i.interpolate({ error })));
      });
    })
  }

  removeAllAddedEntries() {
    return new Promise<VDF_ExtraneousItemsData>((resolve,reject)=>{
      Promise.resolve().then(()=>{
        let extraneousAppIds: VDF_ExtraneousItemsData = {}
        this.forEach((steamDirectory, userId, listItem) => {
          extraneousAppIds[userId] = Object.keys(listItem.addedItems.data);
          let apps = listItem.addedItems.data;
          if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid)
            return;

          for (let appId in apps) {
            listItem.shortcuts.removeItem(appId);
            listItem.addedItems.removeItem(appId);
            listItem.screenshots.removeItem(appId);
            for(let artworkType of artworkTypes) {
              listItem.screenshots.removeItem(ids.shortenAppId(appId).concat(artworkIdDict[artworkType]))
            }
          }
          listItem.addedItems.data = {};
        });
        resolve(extraneousAppIds);
      }).catch((error: Error) => {
        reject(new VDF_Error(this.lang.error.couldNotRemoveEntries__i.interpolate({ error })));
      });
    })
  }
}
