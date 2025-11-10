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
      levelCollections: any,
      cats: any,
      data?: any,
    ) => Promise<any>,
    data?: any,
  ) {
    // Setup Task - Modern Steam stores collections in localconfig.vdf
    const localConfigPath = path.join(
      steamDirectory,
      "userdata",
      userId,
      "config",
      "localconfig.vdf",
    );

    if (!fs.existsSync(localConfigPath)) {
      throw new Error(`localconfig.vdf not found at: ${localConfigPath}`);
    }

    // Check if Steam is running - we cannot safely modify the file if it is
    const { execSync } = require('child_process');
    try {
      const processes = execSync('ps aux', { encoding: 'utf-8' });
      const steamProcesses = processes.split('\n').filter((line: string) => {
        const lower = line.toLowerCase();
        // Must contain 'steam'
        if (!lower.includes('steam')) return false;

        // Exclude: grep, SRM itself, SteamOS system services, other tools
        const excludePatterns = [
          'grep',
          'avahi-daemon',
          'steam-rom-manager',
          'steam rom manager',
          'steamrommanager', // EmuDeck Linux launcher
          'srm', // EmuDeck Windows launcher
          'steamos-',           // SteamOS system services (steamos-manager, steamos_log_submitter, etc.)
          'steamgriddb',        // Decky plugin
          'sddm',               // Display manager
          '/usr/lib/steamos',   // SteamOS system paths
          '/usr/bin/python',    // Python scripts (steamos_log_submitter)
        ];

        return !excludePatterns.some(pattern => lower.includes(pattern));
      });

      if (steamProcesses.length > 0) {
        throw new Error(
          'Steam is currently running. Please close Steam completely before using Steam ROM Manager to modify collections.\n\n' +
          'To close Steam:\n' +
          '- Linux: Run "pkill -9 steam" in terminal\n' +
          '- Windows: Close Steam from system tray\n' +
          '- Mac: Quit Steam from menu bar\n\n' +
          'Running processes found:\n' + steamProcesses.slice(0, 5).join('\n')
        );
      }
    } catch (error) {
      if (error.message.includes('Steam is currently running')) {
        throw error;
      }
      // If ps command fails (e.g., on Windows), log but continue
      console.log('Could not check for Steam processes:', error.message);
    }

    // Read existing collections from CLOUD STORAGE (the authoritative source)
    // NOT from localconfig.vdf (which is just Steam's local cache)
    let collections: any = {};

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
      try {
        const cloudData = JSON.parse(fs.readFileSync(cloudStoragePath, 'utf-8'));
        // Extract collections from cloud storage
        cloudData.forEach((item: any) => {
          if (item && item[0] && item[0].startsWith('user-collections.')) {
            const collectionId = item[0].replace('user-collections.', '');
            if (!item[1].is_deleted && item[1].value) {
              try {
                collections[collectionId] = JSON.parse(item[1].value);
              } catch (e) {
                console.warn(`Failed to parse collection ${collectionId}:`, e.message);
              }
            }
          }
        });
      } catch (e) {
        console.warn(`Failed to read cloud storage, starting with empty collections:`, e.message);
      }
    }

    try {
      // Do Task - LevelDB no longer used, passing empty objects for compatibility
      collections = await task(collections, {}, { remove: () => {}, close: async () => {} }, data);

      // Write collections to cloud storage (Steam will sync localconfig.vdf automatically)
      if (!data || !data.readonly) {
        try {
          if (fs.existsSync(cloudStoragePath)) {
            try {
              const cloudData = JSON.parse(fs.readFileSync(cloudStoragePath, 'utf-8'));
              const timestamp = Math.floor(Date.now() / 1000);

              // MERGE LOGIC: Only modify SRM collections, preserve all other data

              // Step 1: Build map of existing SRM collections in cloud storage
              const existingSRMCollections = new Map<string, number>();
              cloudData.forEach((item: any, index: number) => {
                if (item && item[0] && item[0].startsWith('user-collections.srm-')) {
                  existingSRMCollections.set(item[0], index);
                }
              });

              // Step 2: Update or add SRM collections from our current set
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
                  cloudData[existingIndex] = cloudEntry;
                  existingSRMCollections.delete(key); // Mark as processed
                } else {
                  // Add new SRM collection
                  cloudData.push(cloudEntry);
                }
              }

              // Step 3: Mark remaining SRM collections (not in our set) as deleted
              // These are SRM collections that existed before but are no longer managed
              for (const [key, index] of existingSRMCollections.entries()) {
                if (cloudData[index] && !cloudData[index][1].is_deleted) {
                  cloudData[index][1].is_deleted = true;
                  cloudData[index][1].timestamp = timestamp;
                }
              }

              // Step 4: Write the merged data
              fs.writeFileSync(cloudStoragePath, JSON.stringify(cloudData), { encoding: 'utf-8' });
            } catch (cloudError) {
              console.warn('Failed to update cloud storage:', cloudError.message);
              // Continue to try VDF as fallback
            }
          }

          // Also write to localconfig.vdf as fallback for older Steam versions (pre-Sept 2025)
          // Modern Steam (Sept 2025+) reads from cloud storage and syncs VDF automatically
          // Older Steam (2024-Sept 2025) reads from localconfig.vdf directly
          try {
            const localConfigPath = path.join(steamDirectory, "userdata", userId, "config", "localconfig.vdf");

            if (fs.existsSync(localConfigPath)) {

              const localConfigRaw = fs.readFileSync(localConfigPath, "utf-8");
              const collectionsJson = JSON.stringify(collections);
              const escapedCollections = collectionsJson.replace(/"/g, '\\"');

              // Use regex to preserve key ordering (avoid @node-steam/vdf stringify which reorders keys)
              const userCollectionsMatch = localConfigRaw.match(/"user-collections"\s+"[^"]+"/);
              let newVdfContent: string;

              if (userCollectionsMatch) {
                newVdfContent = localConfigRaw.replace(
                  /"user-collections"\s+"[^"]+"/,
                  `"user-collections"\t\t"${escapedCollections}"`
                );
              } else {
                // Add new user-collections field
                const webStorageEndMatch = localConfigRaw.match(/(\s*)"WebStorage"\s*\{[\s\S]*?\n(\s*)\}/);
                if (webStorageEndMatch) {
                  const indent = webStorageEndMatch[2];
                  const insertPoint = webStorageEndMatch.index + webStorageEndMatch[0].length - (indent.length + 1);
                  newVdfContent = localConfigRaw.slice(0, insertPoint) +
                    `${indent}\t"user-collections"\t\t"${escapedCollections}"\n` +
                    localConfigRaw.slice(insertPoint);
                } else {
                  throw new Error('Could not find WebStorage section in localconfig.vdf');
                }
              }

              fs.writeFileSync(localConfigPath, newVdfContent, { encoding: 'utf-8' });
            }
          } catch (vdfError) {
            console.warn(`Failed to write localconfig.vdf fallback:`, vdfError.message);
            // Non-fatal - cloud storage is the primary method
          }

        } catch (writeError) {
          console.error(`Failed to write collections:`, writeError.message);
          throw new Error(`Could not save collections: ${writeError.message}`);
        }
      }
    } catch (e) {
      throw e;
    }
    // LevelDB is no longer used - no need to close
    // finally {
    //   try {
    //     await cats.close();
    //   } catch (closeError) {
    //     // Ignore close errors for mock object
    //   }
    // }
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
        // LevelDB is no longer used for collections in modern Steam
        // if (
        //   levelCollections[catKey] &&
        //   levelCollections[catKey].added.length == 0
        // ) {
        //   try {
        //     cats.remove(catKey);
        //   } catch (e) {
        //     console.warn('Could not remove from LevelDB:', catKey, e.message);
        //   }
        // }
      }
    }
    // LevelDB is no longer used for collections in modern Steam
    // //Get the ones in levelCollection that we missed
    // for (const catKey of levelKeys) {
    //   if (
    //     catKey.startsWith("srm") &&
    //     !collections[catKey] &&
    //     levelCollections[catKey].added.length == 0
    //   ) {
    //     try {
    //       cats.remove(catKey);
    //     } catch (e) {
    //       console.warn('Could not remove from LevelDB:', catKey, e.message);
    //     }
    //   }
    // }
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
              if (!catName || catName.trim() === '') {
                console.warn('Skipping empty category name');
                return;
              }

              // Create a consistent, safe collection key
              const safeCatName = catName.trim();
              let catKey: string;

              // Check if collection already exists (case-insensitive search)
              const existingKey = Object.keys(collections).find(key => {
                if (collections[key] && collections[key].name) {
                  return collections[key].name.toUpperCase() === safeCatName.toUpperCase();
                }
                return false;
              });

              if (existingKey) {
                catKey = existingKey;
              } else {
                // Generate a new collection key using base64 encoding for safety
                const base64Name = Buffer.from(safeCatName, 'utf8')
                  .toString('base64')
                  .replace(/[+/=]/g, (match) => {
                    return { '+': '-', '/': '_', '=': '' }[match] || match;
                  });
                catKey = `srm-${base64Name}`;
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
              }

              // Remove from removed list if present
              const removedIndex = collections[catKey].removed.indexOf(appIdNew);
              if (removedIndex > -1) {
                collections[catKey].removed.splice(removedIndex, 1);
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
