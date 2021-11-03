import { VDF_ListData, SteamDirectory, PreviewData, PreviewDataApp, AppImages, VDF_ListItem, VDF_ExtraneousItemsData } from "../models";
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as vdf from './helpers/vdf';
import * as appImage from './helpers/app-image';
import * as ids from './helpers/steam';
import * as _ from 'lodash';
import * as path from 'path';

export class VDF_Manager {
  private data: VDF_ListData = {};

  private get lang() {
    return APP.lang.vdfManager;
  }

  prepare(data: SteamDirectory[] | PreviewData) {
    return new Promise<void>((resolve,reject)=>{
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
      chain = chain.then((generatedData)=>{
        if (generatedData.numberOfGeneratedEntries > 0) {
          this.data = generatedData.data;
          if (generatedData.errors.length > 0) {
            reject(new VDF_Error(generatedData.errors))
          } else { resolve(); }
        } else {
          if (generatedData.errors.length > 0) {
            reject(new VDF_Error(generatedData.errors))
          } else {
            reject(new VDF_Error(APP.lang.vdfManager.error.noUsersFound));
          }
        }
      });
    })
  }

  backup(options?: { shortcuts?: boolean, screenshots?: boolean }) {
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

    return Promise.all(promises);
  }

  read(options?: { shortcuts?: { skipIndexing: boolean, read: boolean }, addedItems?: boolean, screenshots?: boolean }) {
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

    return Promise.all(promises);
  }

  write(options?: { shortcuts?: boolean, addedItems?: boolean, screenshots?: boolean }) {
    let promises: Promise<VDF_Error>[] = []
    let writeShortcuts = options !== undefined ? options.shortcuts : true;
    let writeAddedItems = options !== undefined ? options.addedItems : true;
    let writeScreenshots = options !== undefined ? options.screenshots : true;

    for (let steamDirectory in this.data) {
      for (let userId in this.data[steamDirectory]) {
        if (writeShortcuts)
          promises.push(this.data[steamDirectory][userId].shortcuts.write() as Promise<undefined>);
        if (writeAddedItems)
          promises.push(this.data[steamDirectory][userId].addedItems.write() as Promise<undefined>);
        if (writeScreenshots)
          promises.push(this.data[steamDirectory][userId].screenshots.write());
      }
    }

    return new Promise<void>((resolve,reject)=>{
      Promise.all(promises).then((errors)=>{
        if(errors.length>0) {
          let error = new VDF_Error(errors);
          if(error.valid) {
            reject(error);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
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

  mergeData(previewData: PreviewData, images: AppImages, tallimages: AppImages, heroimages: AppImages, logoimages: AppImages, icons: AppImages, deleteDisabledShortcuts: boolean) {
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
              let currentImage = appImage.getCurrentImage(app.images, images);
              let currentTallImage = appImage.getCurrentImage(app.tallimages, tallimages);
              let currentHeroImage = appImage.getCurrentImage(app.heroimages, heroimages);
              let currentLogoImage = appImage.getCurrentImage(app.logoimages, logoimages);
              let currentIcon = appImage.getCurrentImage(app.icons, icons);

              let item = listItem.shortcuts.getItem(appId);

              let icon_path: string = "";
              if(currentIcon !== undefined) {
                let icon_ext: string = currentIcon.imageUrl.split('.').slice(-1)[0];
                icon_ext = ids.map_ext[""+icon_ext] || icon_ext;
                icon_path = path.join(listItem.screenshots.gridDir, `${ids.shortenAppId(appId).concat('_icon')}.${icon_ext}`);
              }

              if (item !== undefined) {
                item.appname = app.title;
                item.exe = app.executableLocation;
                item.StartDir = app.startInDirectory;
                item.LaunchOptions = app.argumentString;
                item.tags = _.union(app.steamCategories, item.tags);
                item.icon = icon_path;
              }
              else if(app.parserType !== 'Steam') {
                listItem.shortcuts.addItem(appId, {
                  appname: app.title,
                  exe: app.executableLocation,
                  StartDir: app.startInDirectory,
                  LaunchOptions: app.argumentString,
                  tags: app.steamCategories,
                  icon: icon_path
                });
              }


              listItem.addedItems.addItem(appId, app.parserId);
              if (currentImage !== undefined && currentImage.imageProvider !== 'Steam') {
                listItem.screenshots.addItem({ appId: appId, title: app.title, url: currentImage.imageUrl });
              }
              if (currentImage !== undefined) {
                listItem.screenshots.addItem({ appId: ids.shortenAppId(appId), title: app.title, url: currentImage.imageUrl });
              }

              if (currentTallImage !== undefined && currentTallImage.imageProvider !== 'Steam') {
                listItem.screenshots.addItem({ appId: ids.shortenAppId(appId).concat('p'), title: app.title, url: currentTallImage.imageUrl });
              }

              if (currentHeroImage !== undefined && currentHeroImage.imageProvider !== 'Steam') {
                listItem.screenshots.addItem({ appId: ids.shortenAppId(appId).concat('_hero'), title: app.title, url: currentHeroImage.imageUrl });
              }
              if (currentLogoImage !== undefined && currentLogoImage.imageProvider !== 'Steam') {
                listItem.screenshots.addItem({ appId: ids.shortenAppId(appId).concat('_logo'), title: app.title, url: currentLogoImage.imageUrl });
              }
              if (currentIcon !== undefined && currentIcon.imageProvider !=='Steam') {
                listItem.screenshots.addItem({appId: ids.shortenAppId(appId).concat('_icon'), title:app.title, url: currentIcon.imageUrl });
              }
            }
            else if (app.status === 'remove') {
              extraneousAppIds[userId].push(appId);
              listItem.shortcuts.removeItem(appId);
              listItem.addedItems.removeItem(appId);
              listItem.screenshots.removeItem(appId);
              listItem.screenshots.removeItem(ids.shortenAppId(appId));
              listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('p'));
              listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_hero'));
              listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_logo'));
              listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_icon'));
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
            listItem.screenshots.removeItem(ids.shortenAppId(appId));
            listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('p'));
            listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_hero'));
            listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_logo'));
            listItem.screenshots.removeItem(ids.shortenAppId(appId).concat('_icon'));
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
