import {
  PreviewData,
  PreviewDataUser,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData
} from "../models";
import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
import { superTypes, ArtworkOnlyType } from './parsers/available-parsers';
import * as SteamCategories from 'steam-categories';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import { Acceptable_Error } from './acceptable-error';

export class CategoryManager {
  private data: PreviewData = {};

  private createList() {
    const list = [];
    for (let steamDirectory in this.data) {
      for (let userId in this.data[steamDirectory]) {
        list.push({
          userId,
          steamDirectory,
          userData: this.data[steamDirectory][userId]
        });
      }
    }
    return list;
  }

  private async doCatTask(steamDirectory: string, userId: string, 
    task: (collections: any, sharedConfigApps: any, levelCollections: any, cats: any, data?: any) => Promise<void>, data?: any) {
    // Setup Task
    let levelDBPath: string;
    if(os.type()=="Windows_NT") {
      levelDBPath = path.join(process.env.localappdata,'Steam','htmlcache','Local Storage','leveldb');
    } else {
      levelDBPath = path.join(steamDirectory,'config','htmlcache','Local Storage','leveldb');
    }
    const cats = new SteamCategories(levelDBPath, userId);
    const localConfigPath = path.join(steamDirectory, 'userdata', userId, 'config', 'localconfig.vdf');
    let localConfig = genericParser.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    const sharedConfigPath = path.join(steamDirectory, 'userdata',userId, '7', 'remote', 'sharedconfig.vdf');
    const sharedConfig = genericParser.parse(fs.readFileSync(sharedConfigPath,'utf-8'));
    let sharedConfigApps = sharedConfig.UserRoamingConfigStore.Software.valve.Steam.apps||{};
    console.log("localConfig", localConfig)
    console.log("sharedConfig", sharedConfig)
    let collections: any = {};
    let levelCollections: any = {};
    const lcs = await cats.read();
    if (localConfig.UserLocalConfigStore.WebStorage['user-collections']) {
      collections = JSON.parse(localConfig.UserLocalConfigStore.WebStorage['user-collections'].replace(/\\"/g, '"'));
    }
    if(lcs && Object.keys(lcs).length) {
      try {
        const topKey = Object.keys(lcs)[0]
        levelCollections = Object.fromEntries(Object.keys(lcs[topKey]).filter(s => s.startsWith('user-collections') && !lcs[topKey][s].is_deleted).map(s=> {return [[s.split('.')[1]], _.cloneDeep(lcs[topKey][s].value)]}));
      } catch (e) {}
    }
    try {
      // Do Task
      collections = await task(collections, sharedConfigApps, levelCollections, cats, data);
      // Cleanup if task is not readonly
      if(!data || !data.readonly) {
        await cats.save();
        localConfig.UserLocalConfigStore.WebStorage['user-collections'] = JSON.stringify(collections).replace(/"/g, '\\"');
        fs.writeFileSync(localConfigPath, genericParser.stringify(localConfig));
      }
    } catch(e) {
      throw e
    } finally {
      await cats.close();
    }
  }

  removeAllCategoriesAndWrite(steamDirectory: string, userId: string) {
    return this.doCatTask(steamDirectory, userId, (collections, sharedConfigApps, levelCollections, cats) => {
      return new Promise<any>((resolve, reject)=> {
        // Nuke the local collections
        for(const catKey of Object.keys(collections)) {
          if(catKey.startsWith('srm')) {
            delete collections[catKey]
            if(levelCollections[catKey] && levelCollections[catKey].added.length == 0) {
              cats.remove(catKey);
            }
          }
        }
        //Get the ones in levelCollection that we missed
        for(const catKey of Object.keys(levelCollections)){
          if(catKey.startsWith('srm') && !collections[catKey]) {
            if(levelCollections[catKey].added.length == 0) {
              cats.remove(catKey);
            }
          }
        }
        resolve(collections);
      })
    })
  }

  readCategories(steamDirectory: string, userId: string) {
    let srmCategories: {[catKey: string]: any} = {};
    return this.doCatTask(steamDirectory, userId, (collections, sharedConfigApps, levelCollections, cats, data) => {
      return new Promise<any>((resolve,reject)=>{
        for(const catKey of Object.keys(collections)) {
          if(catKey.startsWith('srm')) {
            srmCategories[catKey] = {
              collections: collections[catKey],
              levelCollections: levelCollections[catKey]
            }
          }
        }
        for(const catKey of Object.keys(levelCollections)) {
          if(catKey.startsWith('srm') && !collections[catKey]) {
            srmCategories[catKey] = {
              collections: null,
              levelCollections: levelCollections[catKey]
            }
          }
        }
        resolve(collections);
      })
    }, {
      readonly: true
    }).then(()=>{
      return srmCategories;
    });
  }

  writeCat(data: { userId: string, steamDirectory: string, userData: PreviewDataUser }, extraneousShortIds: string[], addedCategories: {[shortId: string]: string[]}) {
    const { userId, steamDirectory, userData } = data;
    return this.doCatTask(steamDirectory, userId, (collections, sharedConfigApps, levelCollections, cats, data) => {
      const {userData, extraneousShortIds, addedCategories} = data;
      return new Promise<any>((resolve, reject) => {
        const appIds = Object.keys(userData.apps).filter(appId => !superTypes[ArtworkOnlyType].includes(userData.apps[appId].parserType));
        const toRemove = _.union(
          appIds.map((x) => steam.shortenAppId(x)),
            extraneousShortIds
        );

        // Clean out local collections
        for (const catKey of Object.keys(collections)) {
          // only clear out apps that list the category of the collection
          let toRemoveForCat: string[];
          toRemoveForCat = toRemove.filter((shortId)=>{
            const appCats = addedCategories[shortId];
            const lcCatName = (levelCollections[catKey] || {}).name || "";
            return !!appCats && appCats.map((catName: string) => catName.toUpperCase()).includes(lcCatName.toUpperCase());
          })
          const newAdded = collections[catKey].added.filter((appId: number) => !toRemoveForCat.map((x)=>+x).includes(appId));
          collections[catKey].added = newAdded;
          if(catKey.startsWith('srm') && newAdded.length == 0) {
            delete collections[catKey]
            // only remove the level collection if newAdded is empty *and* the level collection itself is empty
            if(levelCollections[catKey] && levelCollections[catKey].added.length==0) {
              cats.remove(catKey);
            }
          }
        }
        //Get the ones in levelCollection that we missed
        for (const catKey of Object.keys(levelCollections)) {
          if(catKey.startsWith('srm') && !collections[catKey]) {
            if(levelCollections[catKey].added.length == 0) {
              cats.remove(catKey);
            }
          }
        }
        //Add to local collections
        const addableAppIds = appIds.filter((appId: string) => userData.apps[appId].status=='add');
        for (let appId of addableAppIds) {
          const app = userData.apps[appId];
          if(app.changedId) {
            appId = app.changedId;
          }
          const appIdNew = parseInt(steam.shortenAppId(appId), 10);
          // Loop "steamCategories" for app
          app.steamCategories.forEach((catName: string) => {
            // check the levelDB collections to see if a category already exists
            const lcKeys = Object.keys(levelCollections).filter((lckey: string)=> levelCollections[lckey].name.toUpperCase() === catName.toUpperCase());
            let catKey;
            if(lcKeys.length) {
              catKey = levelCollections[lcKeys[0]].id
            } else {
              catKey = `srm-${Buffer.from(catName).toString('base64')}`;
            }
            // Create level collection if it doesn't exist or is deleted
            if ((x=>!x||x.is_deleted)(cats.get(catKey))) {
              cats.add(catKey, {
                name: catName,
                added: [],
              });
            }
            // Create entries in localconfig.vdf
            if (!collections[catKey]) {
              collections[catKey] = {
                id: catKey,
                added: [],
                removed: [],
              };
            }
            // Add appids to localconfig.vdf
            if (!collections[catKey].added.includes(appIdNew)) {
              collections[catKey].added.push(appIdNew);
            }
          });
        }
        resolve(collections);
      })
    }, {
      userData: userData,
      extraneousShortIds: extraneousShortIds,
      addedCategories: addedCategories
    })
  }

  save(previewData: PreviewData, extraneousAppIds: VDF_ExtraneousItemsData, addedCategories: VDF_AddedCategoriesData) {
    return new Promise((resolve, reject) => {
      this.data = previewData;
      return this.createList().reduce((accumulatorPromise, user) => {
        return accumulatorPromise.then(() => {
          return this.writeCat(user, extraneousAppIds[user.steamDirectory][user.userId].map((x) => steam.shortenAppId(x)), addedCategories[user.steamDirectory][user.userId]);
        });
      }, Promise.resolve())
      .then(() => {
        resolve(extraneousAppIds);
      }).catch((error: Error) => {
        reject(new Acceptable_Error(error));
      });
    });
  }
}
