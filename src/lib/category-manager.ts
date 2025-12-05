import {
  PreviewData,
  PreviewDataUser,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
} from "../models";
import * as steam from "./helpers/steam";
import { superTypes, ArtworkOnlyType } from "./parsers/available-parsers";
import * as path from "path";
import * as fs from "fs-extra";
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
      data?: any,
    ) => Promise<any>,
    data?: any,
  ) {

    // Read existing collections from CLOUD STORAGE (the authoritative source)
    // And (separately) from localconfig.vdf (which is just Steam's local cache)
    let collections: any = {};
    let localCollections: any = {};

    const cloudStorageDir = path.join(
      steamDirectory,
      "userdata",
      userId,
      "config",
      "cloudstorage"
    );

    const namespacesPath = path.join(cloudStorageDir, "cloud-storage-namespaces.json");

    let activeNamespace = 1; // Default to namespace 1
    if (fs.existsSync(namespacesPath)) {
      try {
        const namespaces = JSON.parse(fs.readFileSync(namespacesPath, 'utf-8'));
        // Format: [[1,"798"],[3,"0"]] - find the one with highest version
        const sorted = namespaces.sort((a: any, b: any) => parseInt(b[1]) - parseInt(a[1]));
        if (sorted.length > 0 && sorted[0][1] !== "0") {
          activeNamespace = sorted[0][0];
        }
      } catch (e) {
        console.warn(`Could not parse namespaces file, using default namespace 1:`, e.message);
      }
    }

    const cloudStoragePath = path.join(
      cloudStorageDir,
      `cloud-storage-namespace-${activeNamespace}.json`
    );

    if (fs.existsSync(cloudStoragePath)) {
      console.log(`[doCatTask] Reading collections from cloud storage: ${cloudStoragePath}`);
      try {
        const cloudData = JSON.parse(fs.readFileSync(cloudStoragePath, 'utf-8'));
        console.log(`[doCatTask] Found ${cloudData.length} total entries in cloud storage`);
        
        let srmCollectionCount = 0;
        let nonSrmCollectionCount = 0;
        
        // Extract collections from cloud storage
        cloudData.forEach((item: any) => {
          if (item && item[0] && item[0].startsWith('user-collections.')) {
            const collectionId = item[0].replace('user-collections.', '');
            if (!item[1].is_deleted && item[1].value) {
              try {
                collections[collectionId] = JSON.parse(item[1].value);
                if (collectionId.startsWith('srm-')) {
                  srmCollectionCount++;
                } else {
                  nonSrmCollectionCount++;
                }
              } catch (e) {
                console.warn(`[doCatTask] Failed to parse collection ${collectionId}:`, e.message);
              }
            }
          }
        });
        
        console.log(`[doCatTask] Loaded ${srmCollectionCount} SRM collections and ${nonSrmCollectionCount} non-SRM collections from cloud storage`);
      } catch (e) {
        console.warn(`[doCatTask] Failed to read cloud storage, starting with empty collections:`, e.message);
      }
    } else {
      console.log(`[doCatTask] Cloud storage file does not exist: ${cloudStoragePath}`);
    }


    try {
      console.log(`[doCatTask] Starting task for user ${userId} in ${steamDirectory}`);
      console.log(`[doCatTask] Initial collections loaded from cloud storage:`, collections);
      
      collections = await task(collections, data);

      console.log(`[doCatTask] Collections after task execution:`, collections);

      // Write collections to cloud storage (Steam will sync localconfig.vdf automatically)
      if (!data || !data.readonly) {
        try {
          if (fs.existsSync(cloudStoragePath)) {
            console.log(`[doCatTask] Writing collections to cloud storage at: ${cloudStoragePath}`);
            try {
              const cloudData = JSON.parse(fs.readFileSync(cloudStoragePath, 'utf-8'));
              console.log(`[doCatTask] Cloud storage before merge`, cloudData);
              const timestamp = Math.floor(Date.now() / 1000);

              console.log(`[doCatTask] Cloud storage before merge - total entries:`, cloudData.length);

              // MERGE LOGIC: Only modify SRM collections, preserve all other data

              // Step 1: Build map of existing SRM collections in cloud storage
              const existingSRMCollections = new Map<string, number>();
              const existingNonSRMCollections: string[] = [];
              cloudData.forEach((item: any, index: number) => {
                if (item && item[0] && item[0].startsWith('user-collections.')) {
                  if (item[0].startsWith('user-collections.srm-')) {
                    existingSRMCollections.set(item[0], index);
                  } else {
                    existingNonSRMCollections.push(item[0]);
                  }
                }
              });
              
              console.log(`[doCatTask] Found ${existingSRMCollections.size} existing SRM collections in cloud storage`);
              console.log(`[doCatTask] Found ${existingNonSRMCollections.length} existing non-SRM collections in cloud storage:`, existingNonSRMCollections);

              // Step 2: Update or add SRM collections from our current set
              console.log(`[doCatTask] Processing ${Object.keys(collections).length} collections to write to cloud storage`);
              for (const [collectionId, collectionData] of Object.entries(collections)) {
                const key = `user-collections.${collectionId}`;
                const existingIndex = existingSRMCollections.get(key);

                const cloudEntry = [key, {
                  key: key,
                  timestamp: timestamp,
                  value: JSON.stringify(collectionData),
                  version: String(timestamp),
                  conflictResolutionMethod: "custom",
                  strMethodId: "union-collections"
                }];

                if (existingIndex !== undefined) {
                  // Update existing SRM collection
                  console.log(`[doCatTask] Updating existing SRM collection: ${collectionId}`);
                  cloudData[existingIndex] = cloudEntry;
                  existingSRMCollections.delete(key); // Mark as processed
                } else {
                  // Add new SRM collection
                  console.log(`[doCatTask] Adding new SRM collection: ${collectionId}`);
                  cloudData.push(cloudEntry);
                }
              }

              // Step 3: Mark remaining SRM collections (not in our set) as deleted
              // These are SRM collections that existed before but are no longer managed
              console.log(`[doCatTask] Marking ${existingSRMCollections.size} unused SRM collections as deleted`);
              for (const [key, index] of existingSRMCollections.entries()) {
                if (cloudData[index] && !cloudData[index][1].is_deleted) {
                  console.log(`[doCatTask] Marking SRM collection as deleted: ${key}`);
                  cloudData[index][1].is_deleted = true;
                  cloudData[index][1].timestamp = timestamp;
                }
              }

              // Step 4: Write the merged data
              console.log(`[doCatTask] Writing ${cloudData.length} total entries to cloud storage (preserving non-SRM collections)`);
              
              fs.writeFileSync(cloudStoragePath, JSON.stringify(cloudData), { encoding: 'utf-8' });
            } catch (cloudError) {
              console.warn('Failed to update cloud storage:', cloudError.message);
              // Continue to try VDF as fallback
            }
          }
        } catch (writeError) {
          console.error(`[doCatTask] Failed to write collections:`, writeError.message);
          throw new Error(`Could not save collections: ${writeError.message}`);
        }
      } else {
        console.log(`[doCatTask] Read-only mode, skipping write operations`);
      }
    } catch (e) {
      console.error(`[doCatTask] Task execution failed:`, e.message);
      throw e;
    }
  }
  // toRemove is assumed to be a subset of the keys of addedCategories.
  removeShortsFromCats(
    toRemove: string[],
    collections: any,
    addedCategories: VDF_AddedCategoriesData[string][string],
  ) {
    const localKeys = Object.keys(collections);
    // Clean out local collections
    for (const catKey of localKeys) {
      // only clear out apps that list the category of the collection
      const toRemoveForCat = toRemove.filter((shortId) => {
        const appCats = addedCategories[shortId];
        const collectionsCatName = collections[catKey]?.name || "";
        return appCats
          .map((catName: string) => catName.toUpperCase())
          .includes(collectionsCatName.toUpperCase());
      });
      const nonSRMAdded = collections[catKey].added.filter(
        (appId: number) => !toRemoveForCat.map((x) => +x).includes(appId),
      );
      collections[catKey].added = nonSRMAdded;
      if (catKey.startsWith("srm") && nonSRMAdded.length == 0) {
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
      (collections, data) => {
        const { addedCategories } = data;
        return new Promise<any>((resolve, reject) => {
          const toRemove = Object.keys(addedCategories);
          this.removeShortsFromCats(
            toRemove,
            collections,
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
      (collections, data) => {
        return new Promise<any>((resolve, reject) => {
          for (const catKey of Object.keys(collections)) {
            if (catKey.startsWith("srm")) {
              srmCategories[catKey] = {
                collections: collections[catKey],
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
    console.log(`[writeCat] Starting category write for user ${userId} in ${steamDirectory}`);
    console.log(`[writeCat] Processing ${Object.keys(userData.apps).length} apps with ${extraneousShortIds.length} extraneous shortcuts`);
    
    return this.doCatTask(
      steamDirectory,
      userId,
      (collections, data) => {
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
          console.log(`[writeCat] Removing ${toRemove.length} shortcuts from categories before adding new ones`);
          this.removeShortsFromCats(
            toRemove,
            collections,
            addedCategories,
          );
          //Add to local collections
          const addableAppIds = appIds.filter(
            (appId: string) => userData.apps[appId].status == "add",
          );
          console.log(`[writeCat] Adding ${addableAppIds.length} apps to categories`);
          for (let appId of addableAppIds) {
            const app = userData.apps[appId];
            if (app.changedId) {
              appId = app.changedId;
            }
            const appIdNew = parseInt(steam.shortenAppId(appId), 10);
            // Loop "steamCategories" for app
            app.steamCategories.forEach((catName: string) => {
              if (!catName || catName.trim() === '') {
                console.warn('[writeCat] Skipping empty category name');
                return;
              }

              // Create a consistent, safe collection key
              const safeCatName = catName.trim();
              let catKey: string;
              console.log(`[writeCat] Processing category "${safeCatName}" for app ${appId}`);

              // Check if collection already exists (case-insensitive search)
              const existingKey = Object.keys(collections).find(key => {
                if (collections[key] && collections[key].name) {
                  return collections[key].name.toUpperCase() === safeCatName.toUpperCase();
                }
                return false;
              });

              if (existingKey) {
                catKey = existingKey;
                console.log(`[writeCat] Using existing collection key "${catKey}" for category "${safeCatName}"`);
              } else {
                // Generate a new collection key using base64 encoding for safety
                const base64Name = Buffer.from(safeCatName, 'utf8')
                  .toString('base64')
                  .replace(/[+/=]/g, (match) => {
                    return { '+': '-', '/': '_', '=': '' }[match] || match;
                  });
                catKey = `srm-${base64Name}`;
                console.log(`[writeCat] Created new collection key "${catKey}" for category "${safeCatName}"`);
              }

              // Ensure collection exists in localconfig.vdf with proper structure
              if (!collections[catKey]) {
                collections[catKey] = {
                  id: catKey,
                  name: safeCatName,
                  added: [],
                  removed: []
                };
              }

              // Ensure the collection has the correct name (in case it was updated)
              collections[catKey].name = safeCatName;

              // Ensure arrays exist
              if (!collections[catKey].added) {
                collections[catKey].added = [];
              }
              if (!collections[catKey].removed) {
                collections[catKey].removed = [];
              }

              // Add app to collection if not already present
              if (!collections[catKey].added.includes(appIdNew)) {
                collections[catKey].added.push(appIdNew);
                console.log(`[writeCat] Added app ${appIdNew} to collection "${catKey}"`);
              } else {
                console.log(`[writeCat] App ${appIdNew} already in collection "${catKey}"`);
              }

              // Remove from removed list if present
              const removedIndex = collections[catKey].removed.indexOf(appIdNew);
              if (removedIndex > -1) {
                collections[catKey].removed.splice(removedIndex, 1);
                console.log(`[writeCat] Removed app ${appIdNew} from removed list of collection "${catKey}"`);
              }
            });
          }
          console.log(`[writeCat] Completed processing, final collections:`, Object.keys(collections));
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
