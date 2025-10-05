import {
  PreviewData,
  PreviewDataUser,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
} from "../models";
import * as genericParser from "@node-steam/vdf";
import * as steam from "./helpers/steam";
import { superTypes, ArtworkOnlyType } from "./parsers/available-parsers";
import * as SteamCategories from "steam-categories";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";
import * as _ from "lodash";
import { Acceptable_Error } from "./acceptable-error";

export class CategoryManager {
  private data: PreviewData = {};

  private createList() {
    const list = [];
    for (let steamDirectory in this.data) {
      for (let userId in this.data[steamDirectory]) {
        list.push({
          userId,
          steamDirectory,
          userData: this.data[steamDirectory][userId],
        });
      }
    }
    return list;
  }

  private async doCatTask(
    steamDirectory: string,
    userId: string,
    task: (
      collections: any,
      levelCollections: any,
      cats: any,
      data?: any,
    ) => Promise<any>,
    data?: any,
  ) {
    // Setup Task
    let levelDBPath: string;
    if (os.type() == "Windows_NT") {
      levelDBPath = path.join(
        process.env.localappdata,
        "Steam",
        "htmlcache",
        "Local Storage",
        "leveldb",
      );
    } else {
      levelDBPath = path.join(
        steamDirectory,
        "config",
        "htmlcache",
        "Local Storage",
        "leveldb",
      );
    }
    const cats = new SteamCategories(levelDBPath, userId);
    const localConfigPath = path.join(
      steamDirectory,
      "userdata",
      userId,
      "config",
      "localconfig.vdf",
    );
    let localConfig = genericParser.parse(
      fs.readFileSync(localConfigPath, "utf-8"),
    );
    let collections: any = {};
    let levelCollections: any = {};
    const lcs = await cats.read();
    if (localConfig.UserLocalConfigStore.WebStorage["user-collections"]) {
      collections = JSON.parse(
        localConfig.UserLocalConfigStore.WebStorage["user-collections"].replace(
          /\\"/g,
          '"',
        ),
      );
    }
    if (lcs && Object.keys(lcs).length) {
      try {
        const topKey = Object.keys(lcs)[0];
        levelCollections = Object.fromEntries(
          Object.keys(lcs[topKey])
            .filter(
              (s) =>
                s.startsWith("user-collections") && !lcs[topKey][s].is_deleted,
            )
            .map((s) => {
              return [[s.split(".")[1]], _.cloneDeep(lcs[topKey][s].value)];
            }),
        );
      } catch (e) {}
    }

    // NEW: Also read from cloud storage
    const cloudStorageDir = path.join(
      steamDirectory,
      "userdata",
      userId,
      "config",
      "cloudstorage",
    );
    const namespacesPath = path.join(
      cloudStorageDir,
      "cloud-storage-namespaces.json",
    );

    let activeNamespace = 1;
    if (fs.existsSync(namespacesPath)) {
      try {
        const namespaces = JSON.parse(fs.readFileSync(namespacesPath, "utf-8"));
        const sorted = namespaces.sort(
          (a: any, b: any) => parseInt(b[1]) - parseInt(a[1]),
        );
        if (sorted.length > 0 && sorted[0][1] !== "0") {
          activeNamespace = sorted[0][0];
        }
      } catch (e) {
        console.warn(
          `Could not parse namespaces file, using default namespace 1:`,
          e.message,
        );
      }
    }

    const cloudStoragePath = path.join(
      cloudStorageDir,
      `cloud-storage-namespace-${activeNamespace}.json`,
    );

    // Merge cloud storage into collections
    if (fs.existsSync(cloudStoragePath)) {
      try {
        const cloudData = JSON.parse(
          fs.readFileSync(cloudStoragePath, "utf-8"),
        );
        cloudData.forEach((item: any) => {
          if (item && item[0] && item[0].startsWith("user-collections.")) {
            const collectionId = item[0].replace("user-collections.", "");
            if (!item[1].is_deleted && item[1].value) {
              try {
                const cloudCollection = JSON.parse(item[1].value);
                // Merge cloud data with local collections (cloud takes precedence)
                collections[collectionId] = cloudCollection;
              } catch (e) {
                console.warn(
                  `Failed to parse collection ${collectionId}:`,
                  e.message,
                );
              }
            }
          }
        });
      } catch (e) {
        console.warn(`Failed to read cloud storage:`, e.message);
      }
    }

    try {
      // Do Task
      collections = await task(collections, levelCollections, cats, data);
      // Cleanup if task is not readonly
      if (!data || !data.readonly) {
        // Write to the LevelDB
        await cats.save();

        // NEW: Write to cloud storage
        if (fs.existsSync(cloudStoragePath)) {
          try {
            const cloudData = JSON.parse(
              fs.readFileSync(cloudStoragePath, "utf-8"),
            );
            const timestamp = Math.floor(Date.now() / 1000);

            const existingSRMCollections = new Map<string, number>();
            cloudData.forEach((item: any, index: number) => {
              if (
                item &&
                item[0] &&
                item[0].startsWith("user-collections.srm-")
              ) {
                existingSRMCollections.set(item[0], index);
              }
            });

            for (const [collectionId, collectionData] of Object.entries(
              collections,
            )) {
              const key = `user-collections.${collectionId}`;
              const existingIndex = existingSRMCollections.get(key);

              const cloudEntry = [
                key,
                {
                  key: key,
                  timestamp: timestamp,
                  value: JSON.stringify(collectionData),
                  version: String(timestamp),
                  conflictResolutionMethod: "custom",
                  strMethodId: "union-collections",
                },
              ];

              if (existingIndex !== undefined) {
                cloudData[existingIndex] = cloudEntry;
                existingSRMCollections.delete(key);
              } else {
                cloudData.push(cloudEntry);
              }
            }

            for (const [key, index] of existingSRMCollections.entries()) {
              if (cloudData[index] && !cloudData[index][1].is_deleted) {
                cloudData[index][1].is_deleted = true;
                cloudData[index][1].timestamp = timestamp;
              }
            }

            fs.writeFileSync(cloudStoragePath, JSON.stringify(cloudData), {
              encoding: "utf-8",
            });
          } catch (cloudError) {
            console.warn("Failed to update cloud storage:", cloudError.message);
          }
        }

        // Write Local Category Information
        localConfig.UserLocalConfigStore.WebStorage["user-collections"] =
          JSON.stringify(collections).replace(/"/g, '\\"');
        fs.writeFileSync(localConfigPath, genericParser.stringify(localConfig));
      }
    } catch (e) {
      throw e;
    } finally {
      await cats.close();
    }
  }
  // toRemove is assumed to be a subset of the keys of addedCategories.
  removeShortsFromCats(
    toRemove: string[],
    collections: any,
    levelCollections: any,
    cats: any,
    addedCategories: VDF_AddedCategoriesData[string][string],
  ) {
    const localKeys = Object.keys(collections);
    const levelKeys = Object.keys(levelCollections);
    // Clean out local collections
    for (const catKey of localKeys) {
      // only clear out apps that list the category of the collection
      const toRemoveForCat = toRemove.filter((shortId) => {
        const appCats = addedCategories[shortId];
        const lcCatName = levelCollections[catKey]?.name || "";
        return appCats
          .map((catName: string) => catName.toUpperCase())
          .includes(lcCatName.toUpperCase());
      });
      const nonSRMAdded = collections[catKey].added.filter(
        (appId: number) => !toRemoveForCat.map((x) => +x).includes(appId),
      );
      collections[catKey].added = nonSRMAdded;
      if (catKey.startsWith("srm") && nonSRMAdded.length == 0) {
        delete collections[catKey];
        // only remove the level collection if newAdded is empty *and* the level collection itself is empty
        if (
          levelCollections[catKey] &&
          levelCollections[catKey].added.length == 0
        ) {
          cats.remove(catKey);
        }
      }
    }
    //Get the ones in levelCollection that we missed
    for (const catKey of levelKeys) {
      if (
        catKey.startsWith("srm") &&
        !collections[catKey] &&
        levelCollections[catKey].added.length == 0
      ) {
        cats.remove(catKey);
      }
    }
  }

  removeAllCategoriesAndWrite(
    steamDirectory: string,
    userId: string,
    addedCategories: VDF_AddedCategoriesData[string][string],
  ) {
    return this.doCatTask(
      steamDirectory,
      userId,
      (collections, levelCollections, cats, data) => {
        const { addedCategories } = data;
        return new Promise<any>((resolve, reject) => {
          const toRemove = Object.keys(addedCategories);
          this.removeShortsFromCats(
            toRemove,
            collections,
            levelCollections,
            cats,
            addedCategories,
          );
          resolve(collections);
        });
      },
      {
        addedCategories: addedCategories,
      },
    );
  }

  readCategories(steamDirectory: string, userId: string) {
    let srmCategories: { [catKey: string]: any } = {};
    return this.doCatTask(
      steamDirectory,
      userId,
      (collections, levelCollections, cats, data) => {
        return new Promise<any>((resolve, reject) => {
          for (const catKey of Object.keys(collections)) {
            if (catKey.startsWith("srm")) {
              srmCategories[catKey] = {
                collections: collections[catKey],
                levelCollections: levelCollections[catKey],
              };
            }
          }
          for (const catKey of Object.keys(levelCollections)) {
            if (catKey.startsWith("srm") && !collections[catKey]) {
              srmCategories[catKey] = {
                collections: null,
                levelCollections: levelCollections[catKey],
              };
            }
          }
          resolve(collections);
        });
      },
      {
        readonly: true,
      },
    ).then(() => {
      return srmCategories;
    });
  }

  writeCat(
    data: { userId: string; steamDirectory: string; userData: PreviewDataUser },
    extraneousShortIds: string[],
    addedCategories: { [shortId: string]: string[] },
  ) {
    const { userId, steamDirectory, userData } = data;
    return this.doCatTask(
      steamDirectory,
      userId,
      (collections, levelCollections, cats, data) => {
        const { userData, extraneousShortIds, addedCategories } = data;
        return new Promise<any>((resolve, reject) => {
          const appIds = Object.keys(userData.apps).filter(
            (appId) =>
              !superTypes[ArtworkOnlyType].includes(
                userData.apps[appId].parserType,
              ),
          );
          // Clean out categories
          const shortIds = appIds.map((x) => steam.shortenAppId(x));
          const toRemove = _.intersection(
            Object.keys(addedCategories),
            _.union(shortIds, extraneousShortIds),
          );
          this.removeShortsFromCats(
            toRemove,
            collections,
            levelCollections,
            cats,
            addedCategories,
          );
          //Add to local collections
          const addableAppIds = appIds.filter(
            (appId: string) => userData.apps[appId].status == "add",
          );
          for (let appId of addableAppIds) {
            const app = userData.apps[appId];
            if (app.changedId) {
              appId = app.changedId;
            }
            const appIdNew = parseInt(steam.shortenAppId(appId), 10);
            // Loop "steamCategories" for app
            app.steamCategories.forEach((catName: string) => {
              // check the levelDB collections to see if a category already exists
              const lcKeys = Object.keys(levelCollections).filter(
                (lckey: string) =>
                  levelCollections[lckey].name.toUpperCase() ===
                  catName.toUpperCase(),
              );
              let catKey;
              if (lcKeys.length) {
                catKey = levelCollections[lcKeys[0]].id;
              } else {
                catKey = `srm-${Buffer.from(catName).toString("base64")}`;
              }
              // Create level collection if it doesn't exist or is deleted
              if (((x) => !x || x.is_deleted)(cats.get(catKey))) {
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
              // Add appids to leveldb
            });
          }
          resolve(collections);
        });
      },
      {
        userData: userData,
        extraneousShortIds: extraneousShortIds,
        addedCategories: addedCategories,
      },
    );
  }

  save(
    previewData: PreviewData,
    extraneousAppIds: VDF_ExtraneousItemsData,
    addedCategories: VDF_AddedCategoriesData,
  ) {
    return new Promise((resolve, reject) => {
      this.data = previewData;
      return this.createList()
        .reduce((accumulatorPromise, user) => {
          return accumulatorPromise.then(() => {
            return this.writeCat(
              user,
              extraneousAppIds[user.steamDirectory][user.userId].map((x) =>
                steam.shortenAppId(x),
              ),
              addedCategories[user.steamDirectory][user.userId],
            );
          });
        }, Promise.resolve())
        .then(() => {
          resolve(extraneousAppIds);
        })
        .catch((error: Error) => {
          reject(new Acceptable_Error(error));
        });
    });
  }
}
