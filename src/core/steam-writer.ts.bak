import {
  PreviewData,
  OnlineImages,
  AppSettings,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
  VDF_AllScreenshotsOutcomes,
  Logger,
  AppSelection,
  PreviewDataApp,
  ArtworkType,
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
import * as url from "../lib/helpers/url";
import * as appImage from "../lib/helpers/app-image";
import { artworkTypes } from "../lib/artwork-types";
import * as fs from "fs-extra";
import * as path from "path";
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

  // Saves the chosen artwork of every app into <folder>/srm-image-choices.
  async exportSelection(
    previewData: PreviewData,
    onlineImages: OnlineImages,
    folder: string,
  ) {
    const imageDownloader = new url.ImageDownloader(
      this.appSettings.dnsServers,
    );
    async function saveImage(
      imageUrl: string,
      temporaryDir: string,
      append: string,
    ) {
      const extension = imageUrl.split(/[#?]/)[0].split(".").pop().trim();
      const filename = `${append}.${extension}`;
      await imageDownloader.downloadAndSaveImage(
        imageUrl,
        path.join(temporaryDir, filename),
      );
      return filename;
    }

    {
      let timeout: any;
      try {
        const packagePath = path.join(folder, "srm-image-choices");
        if (fs.existsSync(packagePath)) {
          fs.rmSync(packagePath, { recursive: true, force: true });
        }
        fs.mkdirSync(packagePath);
        const apps: any[] = [];
        let appsCount: number = 0;

        this.loggerService.info(this.lang.info.preparingExport, {
          invokeAlert: true,
          alertTimeout: 3000,
        });

        for (const directory in previewData) {
          for (const userId in previewData[directory]) {
            appsCount += Object.keys(
              previewData[directory][userId].apps,
            ).length;
          }
        }

        timeout = setInterval(() => {
          this.loggerService.info(
            this.lang.info.exportProgress__i.interpolate({
              progress: `${apps.length}/${appsCount}`,
            }),
            { invokeAlert: true, alertTimeout: 3000, doNotAppendToLog: true },
          );
        }, 1500);
        for (const directory in previewData) {
          for (const userId in previewData[directory]) {
            for (const appId in previewData[directory][userId].apps) {
              const app: PreviewDataApp =
                previewData[directory][userId].apps[appId];
              const saveId = app.changedId ? app.changedId : appId;
              let selection: AppSelection = {
                title: app.extractedTitle,
                images: {
                  tall: null,
                  long: null,
                  hero: null,
                  logo: null,
                  icon: null,
                },
              };
              for (const artworkType of artworkTypes) {
                const currentImage = appImage.getCurrentImage(
                  app.images[artworkType],
                  onlineImages[artworkType],
                );
                if (currentImage) {
                  const imageUrl = currentImage.imageUrl;
                  selection.images[artworkType] = {
                    pool: app.images[artworkType].imagePool,
                    filename: await saveImage(
                      imageUrl,
                      packagePath,
                      `${saveId}.${artworkType}`,
                    ),
                  };
                }
              }
              apps.push(selection);
            }
          }
        }

        if (timeout !== undefined) {
          clearInterval(timeout);
        }
        fs.writeFileSync(
          path.join(packagePath, "_selections.json"),
          JSON.stringify(apps, null, 2),
        );

        this.loggerService.success(
          this.lang.success.exportSuccess__i.interpolate({
            path: packagePath,
          }),
          { invokeAlert: true, alertTimeout: 3000 },
        );
      } catch (e) {
        if (timeout !== undefined) {
          clearInterval(timeout);
        }
        this.loggerService.error(
          this.lang.errors.exportError__i.interpolate({
            error: e.message,
          }),
          { invokeAlert: true, alertTimeout: 3000 },
        );
      }
    }
  }

  // Adds the artwork exported to `packagePath` (an srm-image-choices folder)
  // as "imported" images and selects them.

  // Reads an exported srm-image-choices folder: the images to import, as
  // file URLs per pool and artwork type.
  async readSelection(packagePath: string): Promise<
    | {
        ok: true;
        items: { pool: string; artworkType: ArtworkType; imageUrl: string }[];
      }
    | { ok: false; invalidJson: boolean; error: string }
  > {
    try {
      const selections: AppSelection[] = JSON.parse(
        fs.readFileSync(path.join(packagePath, "_selections.json"), "utf8"),
      );
      const items = [];
      for (const selection of selections) {
        for (const artworkType of artworkTypes) {
          const image = selection.images[artworkType];
          if (image) {
            items.push({
              pool: image.pool,
              artworkType,
              imageUrl: url.encodeFile(path.join(packagePath, image.filename)),
            });
          }
        }
      }
      return { ok: true, items };
    } catch (e) {
      return {
        ok: false,
        invalidJson: e instanceof SyntaxError,
        error: e.message,
      };
    }
  }
}
