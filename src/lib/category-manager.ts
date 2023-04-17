import { PreviewData, PreviewDataUser, VDF_ExtraneousItemsData } from "../models";
import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
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
      cats.read()
        .then(() => {
          localConfigPath = path.join(steamDirectory, 'userdata', userId, 'config', 'localconfig.vdf');
          localConfig = genericParser.parse(fs.readFileSync(localConfigPath, 'utf-8'));

          if (localConfig.UserLocalConfigStore.WebStorage['user-collections']) {
            collections = JSON.parse(localConfig.UserLocalConfigStore.WebStorage['user-collections'].replace(/\\"/g, '"'));
          }

          for (const catKey of Object.keys(collections).filter((key:string)=>key.split('-')[0]==='srm')) {
            let toRemove = _.union(Object.keys(userData.apps).map((x)=>steam.shortenAppId(x)),extraneousShortIds).map((x)=>+x);
            collections[catKey].added = collections[catKey].added.filter((appId: number) => toRemove.indexOf(appId)<0);
            if(collections[catKey].added.length == 0 || removeAll) {
              cats.remove(catKey);
              // weirdly this works whereas delete collections[catKey] doesn't
              collections[catKey] = {
                id: catKey,
                added: [],
                removed: [],
              };
            }
          }

          if(!removeAll) {
            for (const appId of Object.keys(userData.apps).filter((appId: string)=>userData.apps[appId].status ==='add')) {
              const app = userData.apps[appId];
              const appIdNew = parseInt(steam.generateShortAppId(app.executableLocation, app.title), 10);

              // Loop "steamCategories" and make a new category from each
              app.steamCategories.forEach((catName: string) => {

                // Create new category if it doesn't exist
                const catKey = `srm-${Buffer.from(catName).toString('base64')}`;
                const platformCat = cats.get(catKey);
                if (!platformCat || platformCat.is_deleted) {
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
                if (collections[catKey].added.indexOf(appIdNew) === -1) {
                  // Only add if it doesn't exist already
                  collections[catKey].added.push(appIdNew);
                }
              });
            }
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
          return this.writeCat(user, extraneousAppIds[user.userId].map((x)=>steam.shortenAppId(x)), removeAll);
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
