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

    // Priority order: Cloud storage (newest) → localconfig.vdf → leveldb (oldest)

    // 1. Try to read from cloud storage (newest/modern system) first
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

    let cloudStorageSuccess = false;
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
                collections[collectionId] = cloudCollection;
                levelCollections[collectionId] = cloudCollection;
                cloudStorageSuccess = true;
              } catch (e) {
                console.warn(
                  `Failed to parse collection ${collectionId}:`,
                  e.message,
                );
              }
            }
          }
        });
        console.log("Successfully read collections from cloud storage (newest)");
      } catch (e) {
        console.warn(`Failed to read cloud storage, will fall back to localconfig.vdf:`, e.message);
      }
    }

    // 2. Fall back to localconfig.vdf if cloud storage failed or doesn't exist
    if (!cloudStorageSuccess && localConfig.UserLocalConfigStore.WebStorage["user-collections"]) {
      console.log("Reading from localconfig.vdf");
      try {
        collections = JSON.parse(
          localConfig.UserLocalConfigStore.WebStorage["user-collections"].replace(
            /\\"/g,
            '"',
          ),
        );
      } catch (e) {
        console.warn("Failed to read from localconfig.vdf:", e.message);
      }
    }

    // 3. Fall back to leveldb (oldest/legacy system) as last resort
    if (!cloudStorageSuccess && Object.keys(collections).length === 0) {
      console.log("Falling back to leveldb (oldest/legacy system)");
      let lcs: any = null;
      try {
        lcs = await cats.read();
        if (lcs && Object.keys(lcs).length) {
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
          console.log("Successfully read collections from leveldb");
        }
      } catch (e) {
        console.warn("Failed to read from leveldb (legacy system):", e.message);
      }
    }

    try {
      // Do Task
      collections = await task(collections, levelCollections, cats, data);
      // Cleanup if task is not readonly
      if (!data || !data.readonly) {
        // Write priority order: Cloud storage (newest) → localconfig.vdf → leveldb (oldest)
        // Only write to ONE system - stop after first success

        let writeSuccess = false;

        // 1. Try cloud storage first (newest/modern system - Steam Deck default)
        if (!writeSuccess && fs.existsSync(cloudStoragePath)) {
          console.log("Attempting to write category information to cloud storage (newest)...");
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

            let addedCount = 0;
            let updatedCount = 0;
            for (const [collectionId, collectionData] of Object.entries(
              collections,
            )) {
              // Skip if collectionData is null or undefined
              if (!collectionData || typeof collectionData !== 'object') {
                console.warn(`Skipping invalid collection ${collectionId}: data is ${typeof collectionData}`);
                continue;
              }

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
                updatedCount++;
              } else {
                cloudData.push(cloudEntry);
                addedCount++;
              }
            }

            let deletedCount = 0;
            for (const [key, index] of existingSRMCollections.entries()) {
              if (cloudData[index] && Array.isArray(cloudData[index]) && cloudData[index][1]) {
                // Ensure cloudData[index][1] is an object before setting properties
                if (typeof cloudData[index][1] === 'object' && cloudData[index][1] !== null) {
                  if (!cloudData[index][1].is_deleted) {
                    cloudData[index][1].is_deleted = true;
                    cloudData[index][1].timestamp = timestamp;
                    deletedCount++;
                  }
                }
              }
            }

            console.log(`Cloud storage: ${addedCount} collections added, ${updatedCount} updated, ${deletedCount} marked as deleted`);

            const jsonData = JSON.stringify(cloudData);
            console.log(`Writing ${jsonData.length} bytes to cloud storage...`);
            await fs.writeFile(cloudStoragePath, jsonData, {
              encoding: "utf-8",
            });
            // Force flush to disk by opening and syncing
            await fs.promises.open(cloudStoragePath, 'r+').then(async (fd) => {
              await fd.sync();
              await fd.close();
            });
            console.log("✓ Successfully wrote to cloud storage - DONE");
            writeSuccess = true;
          } catch (cloudError) {
            console.warn("✗ Failed to write to cloud storage:", cloudError.message);
          }
        }

        // 2. Fall back to localconfig.vdf if cloud storage failed
        if (!writeSuccess) {
          console.log("Attempting to write category information to localconfig.vdf...");
          try {
            const collectionCount = Object.keys(collections).length;
            console.log(`localconfig.vdf: Writing ${collectionCount} collections`);

            // Ensure the WebStorage object exists
            if (!localConfig.UserLocalConfigStore) {
              localConfig.UserLocalConfigStore = {};
            }
            if (!localConfig.UserLocalConfigStore.WebStorage) {
              localConfig.UserLocalConfigStore.WebStorage = {};
            }
            localConfig.UserLocalConfigStore.WebStorage["user-collections"] =
              JSON.stringify(collections).replace(/"/g, '\\"');
            const vdfData = genericParser.stringify(localConfig);
            console.log(`Writing ${vdfData.length} bytes to localconfig.vdf...`);
            await fs.writeFile(localConfigPath, vdfData);
            // Force flush to disk by opening and syncing
            await fs.promises.open(localConfigPath, 'r+').then(async (fd) => {
              await fd.sync();
              await fd.close();
            });
            console.log("✓ Successfully wrote to localconfig.vdf - DONE");
            writeSuccess = true;
          } catch (localConfigError) {
            console.warn("✗ Failed to write to localconfig.vdf:", localConfigError.message);
          }
        }

        // 3. Fall back to leveldb as last resort (oldest/legacy system)
        if (!writeSuccess) {
          console.log("Attempting to write category information to leveldb (last resort)...");
          try {
            let removedCount = 0;
            let addedCount = 0;
            let updatedCount = 0;

            // Remove SRM collections from leveldb that are no longer in collections
            for (const catKey of Object.keys(levelCollections)) {
              if (catKey.startsWith("srm") && !collections[catKey]) {
                cats.remove(catKey);
                removedCount++;
              }
            }

            // Now we need to populate the leveldb cats object with current collections
            for (const [catKey, catData] of Object.entries(collections)) {
              if (catData && typeof catData === 'object') {
                // Create level collection if it doesn't exist or is deleted
                if (((x: any) => !x || x.is_deleted)(cats.get(catKey))) {
                  cats.add(catKey, {
                    name: (catData as any).name || catKey,
                    added: (catData as any).added || [],
                  });
                  addedCount++;
                } else {
                  // Update existing collection
                  const existingCat = cats.get(catKey);
                  if (existingCat) {
                    existingCat.added = (catData as any).added || [];
                    updatedCount++;
                  }
                }
              }
            }

            console.log(`leveldb: ${addedCount} collections added, ${updatedCount} updated, ${removedCount} removed`);
            await cats.save();
            console.log("✓ Successfully wrote to leveldb - DONE");
            writeSuccess = true;
          } catch (leveldbError) {
            console.warn("✗ Failed to write to leveldb:", leveldbError.message);
          }
        }

        if (!writeSuccess) {
          throw new Error("Failed to write category information to any storage system (cloud storage, localconfig.vdf, or leveldb)");
        }
      }
    } catch (e) {
      throw e;
    } finally {
      if (cats) {
        try {
          await cats.close();
        } catch (closeError) {
          console.warn("Failed to close leveldb connection:", closeError.message);
        }
      }
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
      // Skip if collection doesn't exist or doesn't have the added property
      if (!collections[catKey] || !collections[catKey].added) {
        console.warn(`Skipping invalid collection ${catKey} in removeShortsFromCats`);
        continue;
      }

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
      }
    }
    //Get the ones in levelCollection that we missed - remove from collections if empty
    for (const catKey of levelKeys) {
      if (
        catKey.startsWith("srm") &&
        levelCollections[catKey] &&
        levelCollections[catKey].added &&
        levelCollections[catKey].added.length == 0
      ) {
        // Just delete from collections, leveldb removal will happen during write phase if needed
        delete collections[catKey];
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
                  levelCollections[lckey] &&
                  levelCollections[lckey].name &&
                  levelCollections[lckey].name.toUpperCase() ===
                  catName.toUpperCase(),
              );
              let catKey;
              if (lcKeys.length) {
                catKey = levelCollections[lcKeys[0]].id;
              } else {
                catKey = `srm-${Buffer.from(catName).toString("base64")}`;
              }

              // Create entries in collections object (used for cloud storage AND localconfig.vdf)
              if (!collections[catKey]) {
                collections[catKey] = {
                  id: catKey,
                  name: catName,
                  added: [],
                  removed: [],
                };
              }
              // Add appids to collections
              if (!collections[catKey].added.includes(appIdNew)) {
                collections[catKey].added.push(appIdNew);
              }
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

  async save(
    previewData: PreviewData,
    extraneousAppIds: VDF_ExtraneousItemsData,
    addedCategories: VDF_AddedCategoriesData,
  ) {
    try {
      console.log("[SAVE] Starting category save operation");
      this.data = previewData;
      const userList = this.createList();
      console.log(`[SAVE] Processing ${userList.length} users`);

      for (let i = 0; i < userList.length; i++) {
        const user = userList[i];
        console.log(`[SAVE] Writing categories for user ${i + 1}/${userList.length}: ${user.userId}`);
        await this.writeCat(
          user,
          extraneousAppIds[user.steamDirectory][user.userId].map((x) =>
            steam.shortenAppId(x),
          ),
          addedCategories[user.steamDirectory][user.userId],
        );
        console.log(`[SAVE] Completed writing categories for user ${i + 1}/${userList.length}`);
      }

      console.log("[SAVE] All category write operations completed successfully");
      return extraneousAppIds;
    } catch (error) {
      console.log("[SAVE] Error during category save:", error);
      throw new Acceptable_Error(error);
    }
  }
}
