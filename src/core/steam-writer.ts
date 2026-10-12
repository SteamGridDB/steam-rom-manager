import {
  PreviewData,
  OnlineImages,
  AppSettings,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
  VDF_AllScreenshotsOutcomes,
  Logger,
} from "../models";
import {
  VDF_Manager,
  VDF_Error,
  CategoryManager,
  ControllerManager,
  CompatToolManager,
  Acceptable_Error,
} from "../lib";
import { APP } from "../variables";
import * as steam from "../lib/helpers/steam";
import { ParsersStore } from "./parsers-store";
import { SettingsStore } from "./settings-store";

export interface SaveResult {
  ok: boolean;
  // Artwork written to each user's grid folder (batch writes only).
  outcomes?: VDF_AllScreenshotsOutcomes;
}

export type BatchProgress = { update: string; batch: number };

// Writes a preview list to Steam: shortcuts.vdf, artwork, addedItemsV2.json,
// categories, controller templates and compat tools; or removes everything
// SRM added. Needs file system access, so it runs in the main process.
export class SteamWriter {
  private categoryManager = new CategoryManager();

  constructor(
    private loggerService: Logger,
    private parsers: Pick<ParsersStore, "getKnownSteamDirectories">,
    private settings: Pick<SettingsStore, "get">,
  ) {}

  private get appSettings(): AppSettings {
    return this.settings.get();
  }

  private get lang() {
    return APP.lang.preview.service;
  }

  async removeCategories(
    steamDir: string,
    userId: string,
    addedCategories: VDF_AddedCategoriesData[string][string],
  ) {
    try {
      this.loggerService.info(
        `Removing category information for user ${userId}.`,
      );
      await this.categoryManager.removeAllCategoriesAndWrite(
        steamDir,
        userId,
        addedCategories,
      );
    } catch (error) {
      this.loggerService.error(this.lang.errors.categorySaveError, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.loggerService.error(
        this.lang.errors.categorySaveError__i.interpolate({
          error: error.message,
        }),
      );
    }
  }

  // Saves `previewData` to Steam, or with removeAll removes everything SRM
  // ever added from every known Steam install (previewData is then unused).
  async save(
    previewData: PreviewData,
    onlineImages: OnlineImages,
    { batchWrite, removeAll }: { batchWrite: boolean; removeAll: boolean },
    onBatchProgress: (progress: BatchProgress) => void = () => {},
  ): Promise<SaveResult> {
    const knownSteamDirectories = this.parsers.getKnownSteamDirectories();
    if (removeAll && knownSteamDirectories.length === 0) {
      this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      return { ok: false };
    }
    let savedOutcomes: VDF_AllScreenshotsOutcomes;
    let vdfManager = new VDF_Manager();
    let exAppIds: VDF_ExtraneousItemsData = undefined;
    let addedCats: VDF_AddedCategoriesData = undefined;
    let chain: Promise<any> = Promise.resolve()
      .then(() => {
        this.loggerService.info(this.lang.info.populatingVDF_List, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return vdfManager.prepare(
          removeAll ? knownSteamDirectories : previewData,
        );
      })
      .then(() => {
        this.loggerService.info(this.lang.info.creatingBackups, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return vdfManager.backup();
      })
      .then(() => {
        this.loggerService.info(this.lang.info.readingVDF_Files, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return vdfManager.read();
      });
    if (!removeAll) {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.mergingVDF_entries, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return vdfManager.mergeData(
          previewData,
          onlineImages,
          this.appSettings.previewSettings.deleteDisabledShortcuts,
        );
      });
    } else {
      chain = chain.then(() => {
        this.loggerService.info(this.lang.info.removingVDF_entries, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return vdfManager.removeAllAddedEntries();
      });
    }
    chain = chain
      .then(
        ({
          extraneousAppIds,
          addedCategories,
        }: {
          extraneousAppIds: VDF_ExtraneousItemsData;
          addedCategories: VDF_AddedCategoriesData;
        }) => {
          exAppIds = extraneousAppIds; //Non artwork-only extraneous app ids
          addedCats = addedCategories; //Added categories for all app ids
        },
      )
      .then(async () => {
        if (!removeAll && !this.appSettings.previewSettings.disableCategories) {
          await steam.performSteamlessTask(
            this.appSettings,
            this.loggerService,
            async () => {
              this.loggerService.info(this.lang.info.savingCategories);
              await this.categoryManager.save(previewData, exAppIds, addedCats);
            },
          );
        }
        if (removeAll && !this.appSettings.previewSettings.disableCategories) {
          await steam.performSteamlessTask(
            this.appSettings,
            this.loggerService,
            async () => {
              for (let steamDir of knownSteamDirectories) {
                const accounts = await steam.getAvailableLogins(steamDir);
                for (let account of accounts) {
                  await this.removeCategories(
                    steamDir,
                    account.accountID,
                    addedCats[steamDir][account.accountID],
                  );
                }
              }
            },
          );
        }
      })
      .catch((error: Acceptable_Error | Error) => {
        if (error instanceof Acceptable_Error) {
          this.loggerService.error(this.lang.errors.categorySaveError, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
          this.loggerService.error(
            this.lang.errors.categorySaveError__i.interpolate({
              error: error.message,
            }),
          );
        } else {
          throw error;
        }
      })
      .then(() => {
        if (!removeAll) {
          this.loggerService.info(this.lang.info.savingControllers);
          const controllerManager = new ControllerManager();
          return controllerManager.save(previewData, exAppIds);
        }
      })
      .catch((error: Acceptable_Error | Error) => {
        if (error instanceof Acceptable_Error) {
          this.loggerService.error(this.lang.errors.controllerSaveError, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
          this.loggerService.error(
            this.lang.errors.controllerSaveError__i.interpolate({
              error: error.message,
            }),
          );
        } else {
          throw error;
        }
      })
      .then(async () => {
        // config.vdf is per-install and Steam rewrites it on exit, so patch it
        // with Steam closed (same steamless window the categories step uses).
        await steam.performSteamlessTask(
          this.appSettings,
          this.loggerService,
          async () => {
            this.loggerService.info(this.lang.info.savingCompatTools);
            const compatToolManager = new CompatToolManager(this.loggerService);
            if (removeAll) {
              // exAppIds holds only SRM-owned (non artwork-only) shortcuts.
              await compatToolManager.removeAll(
                knownSteamDirectories,
                exAppIds,
              );
            } else {
              await compatToolManager.save(previewData, exAppIds);
            }
          },
        );
      })
      .catch((error: Acceptable_Error | Error) => {
        if (error instanceof Acceptable_Error) {
          this.loggerService.error(this.lang.errors.compatToolSaveError, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
          this.loggerService.error(
            this.lang.errors.compatToolSaveError__i.interpolate({
              error: error.message,
            }),
          );
        } else {
          throw error;
        }
      })
      .then(() => {
        if (removeAll) {
          this.loggerService.info(this.lang.info.removingVDF_entries);
        } else {
          this.loggerService.info(
            this.lang.info.writingVDF_entries__i.interpolate({
              batchSize: this.appSettings.batchDownloadSize,
            }),
            { invokeAlert: true, alertTimeout: 3000 },
          );
        }
        if (batchWrite) {
          vdfManager
            .getBatchProgress()
            .subscribe(
              ({ update, batch }: { update: string; batch: number }) => {
                if (batch > -1) {
                  this.loggerService.info(update, {
                    invokeAlert: true,
                    alertTimeout: 3000,
                  });
                  onBatchProgress({ update, batch });
                }
              },
            );
        }
        return vdfManager.write(
          batchWrite,
          this.appSettings.batchDownloadSize,
          this.appSettings.dnsServers,
        );
      })
      .then(
        ({
          nonFatal,
          outcomes,
        }: {
          nonFatal: VDF_Error;
          outcomes: VDF_AllScreenshotsOutcomes;
        }) => {
          if (nonFatal) {
            this.loggerService.error(nonFatal);
          }
          savedOutcomes = outcomes;
        },
      )
      .then(() => {
        if (removeAll) {
          this.loggerService.success(this.lang.success.removingVDF_entries, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
        } else {
          this.loggerService.success(this.lang.success.writingVDF_entries, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
        }
        return true;
      })
      .catch((failureError: Error) => {
        this.loggerService.error(this.lang.errors.fatalError, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        this.loggerService.error(failureError);
        return false;
      });
    const ok: boolean = await chain;
    return { ok, outcomes: batchWrite ? savedOutcomes : undefined };
  }
}
