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
    task: (collections: any, data?: any) => Promise<any>,
    data?: any,
  ) {
    // Read existing collections from CLOUD STORAGE (the authoritative source)
    // And (separately) from localconfig.vdf (which is just Steam's local cache)
    let collections: any = {};
    let originalCollections: any = {};

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

    // The namespace that holds the user's collections (namespace 1 in
    // practice). Not "the highest version": each namespace counts its own
    // versions, and another one's getting ahead would send SRM's collections
    // into the wrong file.
    let activeNamespace = 1;
    if (fs.existsSync(namespacesPath)) {
      try {
        // Format: [[1,"798"],[3,"0"]]
        const namespaces: [number, string][] = JSON.parse(
          fs.readFileSync(namespacesPath, "utf-8"),
        );
        const withCollections = namespaces.find(([id]) => {
          const file = path.join(
            cloudStorageDir,
            `cloud-storage-namespace-${id}.json`,
          );
          return (
            fs.existsSync(file) &&
            fs.readFileSync(file, "utf-8").includes('"user-collections.')
          );
        });
        if (withCollections) {
          activeNamespace = withCollections[0];
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

    if (fs.existsSync(cloudStoragePath)) {
      console.log(
        `[doCatTask] Reading collections from cloud storage: ${cloudStoragePath}`,
      );
      try {
        const cloudData = JSON.parse(
          fs.readFileSync(cloudStoragePath, "utf-8"),
        );
        console.log(
          `[doCatTask] Found ${cloudData.length} total entries in cloud storage`,
        );

        let srmCollectionCount = 0;
        let nonSrmCollectionCount = 0;

        // Extract collections from cloud storage
        cloudData.forEach((item: any) => {
          if (item && item[0] && item[0].startsWith("user-collections.")) {
            const collectionId = item[0].replace("user-collections.", "");
            if (!item[1].is_deleted && item[1].value) {
              try {
                collections[collectionId] = JSON.parse(item[1].value);
                // Ensure the added/removed arrays exist (sometimes they don't for certain collections)
                collections[collectionId].added ||= [];
                collections[collectionId].removed ||= [];
                // Remember how it looked so unchanged ones aren't rewritten
                originalCollections[collectionId] = _.cloneDeep(
                  collections[collectionId],
                );
                if (collectionId.startsWith("srm-")) {
                  srmCollectionCount++;
                } else {
                  nonSrmCollectionCount++;
                }
              } catch (e) {
                console.warn(
                  `[doCatTask] Failed to parse collection ${collectionId}:`,
                  e.message,
                );
              }
            }
          }
        });

        console.log(
          `[doCatTask] Loaded ${srmCollectionCount} SRM collections and ${nonSrmCollectionCount} non-SRM collections from cloud storage`,
        );
      } catch (e) {
        console.warn(
          `[doCatTask] Failed to read cloud storage, starting with empty collections:`,
          e.message,
        );
      }
    } else {
      console.log(
        `[doCatTask] Cloud storage file does not exist: ${cloudStoragePath}`,
      );
    }

    try {
      console.log(
        `[doCatTask] Starting task for user ${userId} in ${steamDirectory}`,
      );
      console.log(
        `[doCatTask] Initial collections loaded from cloud storage:`,
        collections,
      );

      collections = await task(collections, data);

      console.log(`[doCatTask] Collections after task execution:`, collections);

      // Write collections to cloud storage (Steam will sync localconfig.vdf automatically)
      if (!data || !data.readonly) {
        try {
          if (fs.existsSync(cloudStoragePath)) {
            console.log(
              `[doCatTask] Writing collections to cloud storage at: ${cloudStoragePath}`,
            );
            try {
              const cloudData = JSON.parse(
                fs.readFileSync(cloudStoragePath, "utf-8"),
              );
              console.log(`[doCatTask] Cloud storage before merge`, cloudData);
              const timestamp = Math.floor(Date.now() / 1000);

              console.log(
                `[doCatTask] Cloud storage before merge - total entries:`,
                cloudData.length,
              );

              // MERGE LOGIC: Only modify SRM collections, preserve all other data

              // Step 1: Index every existing collection entry, so collections
              // are updated in place rather than appended as duplicates.
              const existingCollections = new Map<string, number>();
              const existingSRMCollections = new Map<string, number>();
              cloudData.forEach((item: any, index: number) => {
                if (
                  item &&
                  item[0] &&
                  item[0].startsWith("user-collections.")
                ) {
                  existingCollections.set(item[0], index);
                  if (item[0].startsWith("user-collections.srm-")) {
                    existingSRMCollections.set(item[0], index);
                  }
                }
              });

              console.log(
                `[doCatTask] Found ${existingSRMCollections.size} existing SRM collections and ${existingCollections.size - existingSRMCollections.size} non-SRM collections in cloud storage`,
              );

              // Step 2: Update or add collections from our current set. SRM's
              // own collections are always written; the user's collections
              // only when SRM changed them (added/removed its games), so their
              // timestamps aren't bumped for nothing.
              console.log(
                `[doCatTask] Processing ${Object.keys(collections).length} collections to write to cloud storage`,
              );
              for (const [collectionId, collectionData] of Object.entries(
                collections,
              )) {
                const key = `user-collections.${collectionId}`;
                if (
                  !collectionId.startsWith("srm-") &&
                  _.isEqual(collectionData, originalCollections[collectionId])
                ) {
                  continue;
                }
                const existingIndex = existingCollections.get(key);

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
                  console.log(
                    `[doCatTask] Updating existing collection: ${collectionId}`,
                  );
                  cloudData[existingIndex] = cloudEntry;
                  existingSRMCollections.delete(key); // Mark as processed
                } else {
                  console.log(
                    `[doCatTask] Adding new collection: ${collectionId}`,
                  );
                  cloudData.push(cloudEntry);
                }
              }

              // Step 3: Mark remaining SRM collections (not in our set) as deleted
              // These are SRM collections that existed before but are no longer managed
              console.log(
                `[doCatTask] Marking ${existingSRMCollections.size} unused SRM collections as deleted`,
              );
              for (const [key, index] of existingSRMCollections.entries()) {
                if (cloudData[index] && !cloudData[index][1].is_deleted) {
                  console.log(
                    `[doCatTask] Marking SRM collection as deleted: ${key}`,
                  );
                  cloudData[index][1].is_deleted = true;
                  cloudData[index][1].timestamp = timestamp;
                }
              }

              // Step 4: Write the merged data
              console.log(
                `[doCatTask] Writing ${cloudData.length} total entries to cloud storage (preserving non-SRM collections)`,
              );

              fs.writeFileSync(cloudStoragePath, JSON.stringify(cloudData), {
                encoding: "utf-8",
              });
            } catch (cloudError) {
              console.warn(
                "Failed to update cloud storage:",
                cloudError.message,
              );
              // Continue to try VDF as fallback
            }
          }
        } catch (writeError) {
          console.error(
            `[doCatTask] Failed to write collections:`,
            writeError.message,
          );
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
    // The shortcuts to take out of each collection, by its (uppercase)
    // name: those whose categories include it. (Built once, not per
    // collection: thousands of shortcuts x collections.)
    const removeByName = new Map<string, Set<number>>();
    for (const shortId of toRemove) {
      for (const catName of addedCategories[shortId] ?? []) {
        const name = catName.toUpperCase();
        if (!removeByName.has(name)) removeByName.set(name, new Set());
        removeByName.get(name).add(+shortId);
      }
    }
    for (const catKey of Object.keys(collections)) {
      const remove = removeByName.get(
        (collections[catKey]?.name || "").toUpperCase(),
      );
      const nonSRMAdded = collections[catKey].added.filter(
        (appId: number) => !remove?.has(appId),
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
          this.removeShortsFromCats(toRemove, collections, addedCategories);
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
    console.log(
      `[writeCat] Starting category write for user ${userId} in ${steamDirectory}`,
    );
    console.log(
      `[writeCat] Processing ${Object.keys(userData.apps).length} apps with ${extraneousShortIds.length} extraneous shortcuts`,
    );

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
          console.log(
            `[writeCat] Removing ${toRemove.length} shortcuts from categories before adding new ones`,
          );
          this.removeShortsFromCats(toRemove, collections, addedCategories);
          //Add to local collections
          const addableAppIds = appIds.filter(
            (appId: string) => userData.apps[appId].status == "add",
          );
          console.log(
            `[writeCat] Adding ${addableAppIds.length} apps to categories`,
          );
          // Collection keys by (uppercase) name, the first one found as
          // before; members of each collection (instead of searching
          // arrays for every app and category).
          const keyByName = new Map<string, string>();
          for (const key of Object.keys(collections)) {
            const name = collections[key]?.name;
            if (name && !keyByName.has(name.toUpperCase())) {
              keyByName.set(name.toUpperCase(), key);
            }
          }
          const members = new Map<string, Set<number>>();
          const membersOf = (catKey: string) => {
            if (!members.has(catKey)) {
              members.set(catKey, new Set(collections[catKey].added));
            }
            return members.get(catKey);
          };
          for (let appId of addableAppIds) {
            const app = userData.apps[appId];
            if (app.changedId) {
              appId = app.changedId;
            }
            const appIdNew = parseInt(steam.shortenAppId(appId), 10);
            for (const catName of app.steamCategories) {
              if (!catName || catName.trim() === "") {
                continue;
              }
              const safeCatName = catName.trim();
              let catKey = keyByName.get(safeCatName.toUpperCase());
              if (!catKey) {
                // A new collection key, base64 for safety
                const base64Name = Buffer.from(safeCatName, "utf8")
                  .toString("base64")
                  .replace(/[+/=]/g, (match) => {
                    return { "+": "-", "/": "_", "=": "" }[match] || match;
                  });
                catKey = `srm-${base64Name}`;
                keyByName.set(safeCatName.toUpperCase(), catKey);
              }

              // Ensure collection exists in localconfig.vdf with proper structure
              if (!collections[catKey]) {
                collections[catKey] = {
                  id: catKey,
                  name: safeCatName,
                  added: [],
                  removed: [],
                };
              }

              // Ensure the collection has the correct name (in case it was updated)
              collections[catKey].name = safeCatName;

              // Ensure added/remove arrays exist
              collections[catKey].added ||= [];
              collections[catKey].removed ||= [];

              // Add app to collection if not already present
              const inCollection = membersOf(catKey);
              if (!inCollection.has(appIdNew)) {
                inCollection.add(appIdNew);
                collections[catKey].added.push(appIdNew);
              }

              // Remove from removed list if present
              const removedIndex =
                collections[catKey].removed.indexOf(appIdNew);
              if (removedIndex > -1) {
                collections[catKey].removed.splice(removedIndex, 1);
              }
            }
          }
          console.log(
            `[writeCat] Completed processing, final collections:`,
            Object.keys(collections),
          );
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
