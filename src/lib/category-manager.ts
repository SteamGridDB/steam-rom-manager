import { PreviewData, PreviewDataUser, VDF_ExtraneousItemsData } from "../models";
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

  createList() {
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

  writeCat(data: { userId: string, steamDirectory: string, userData: PreviewDataUser }, extraneousShortIds: string[], removeAll: boolean) {
    return new Promise<void>((resolve, reject) => {
      const { userId, steamDirectory, userData } = data;
      let levelDBPath: string;
      if(os.type()=="Windows_NT") {
        levelDBPath = path.join(process.env.localappdata,'Steam','htmlcache','Local Storage','leveldb');
      } else {
        levelDBPath = path.join(steamDirectory,'config','htmlcache','Local Storage','leveldb');
      }
      const cats = new SteamCategories(levelDBPath, userId);
      let localConfigPath='';
      let localConfig: any = {};
      let collections: any = {};
      let levelCollections: any = {};
      cats.read()
        .then((lcs: any) => {
          localConfigPath = path.join(steamDirectory, 'userdata', userId, 'config', 'localconfig.vdf');
          localConfig = genericParser.parse(fs.readFileSync(localConfigPath, 'utf-8'));

          if (localConfig.UserLocalConfigStore.WebStorage['user-collections']) {
            collections = JSON.parse(localConfig.UserLocalConfigStore.WebStorage['user-collections'].replace(/\\"/g, '"'));
          }
          if(lcs && Object.keys(lcs).length) {
            try {
              const topKey = Object.keys(lcs)[0]
              levelCollections = Object.fromEntries(Object.keys(lcs[topKey]).filter(s => s.startsWith('user-collections') && !lcs[topKey][s].is_deleted).map(s=> {return [[s.split('.')[1]], lcs[topKey][s].value]}));
            } catch (e) {}
          }
          const appIds = Object.keys(userData.apps).filter(appId => !superTypes[ArtworkOnlyType].includes(userData.apps[appId].parserType));
          const toRemove = _.union(
            appIds.map((x) => steam.shortenAppId(x)),
            extraneousShortIds
          ).map((x) => +x);

          // Clear out local collections
          for (const catKey of Object.keys(collections)) {
            const newAdded = collections[catKey].added.filter((appId: number) => !toRemove.includes(appId));
            collections[catKey].added = newAdded;
            if(catKey.startsWith('srm') && (newAdded.length == 0 || removeAll)) {

              // weirdly this deletes the collection whereas `delete collections[catKey]` does not
              collections[catKey] = {
                id: catKey,
                added: [],
                removed: [],
              };
              cats.remove(catKey);
            }
          }

          const addableAppIds = removeAll ? [] : appIds.filter((appId: string)=>userData.apps[appId].status=='add');
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
        }).catch((error: any)=>{
          throw error;
        })
        .then(() => {
          cats.save()
        })
        .then(()=>{
          localConfig.UserLocalConfigStore.WebStorage['user-collections'] = JSON.stringify(collections).replace(/"/g, '\\"');
          const newVDF = genericParser.stringify(localConfig);
          fs.writeFileSync(localConfigPath, newVDF);
        })
        .then(()=>{return cats.close()})
        .then(()=>{resolve()})
        .catch((error: any) => {
          cats.close().then(()=>{
            reject(error);
          })
        });
    });
  }

  save(PreviewData: PreviewData, extraneousAppIds: VDF_ExtraneousItemsData, removeAll: boolean) {
    return new Promise((resolveSave, rejectSave) => {
      this.data = PreviewData;

      let result = this.createList().reduce((accumulatorPromise, user) => {
        return accumulatorPromise.then(() => {
          return this.writeCat(user, extraneousAppIds[user.userId].map((x) => steam.shortenAppId(x)), removeAll);
        });
      }, Promise.resolve());

      return result.then(() => {
        resolveSave(extraneousAppIds);
      }).catch((error: Error) => {
        rejectSave(new Acceptable_Error(error));
      });
    });
  }
}
