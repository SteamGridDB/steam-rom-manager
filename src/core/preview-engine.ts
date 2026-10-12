import { BehaviorSubject, Subject } from "rxjs";
import * as sgdbSearch from "../lib/image-providers/sgdb-search";
import {
  PreviewData,
  ImageContent,
  ParsedUserConfiguration,
  OnlineImages,
  PreviewVariables,
  ProviderCallbackEventMap,
  PreviewDataApp,
  AppSettings,
  SteamTree,
  VDF_ExtraneousItemsData,
  VDF_AddedCategoriesData,
  VDF_AllScreenshotsOutcomes,
  AppSelection,
  SGDBToArt,
  OnlineProviderType,
  PreviewDataAppImage,
  MultiLocalProviderType,
  ArtworkType,
  initArtworkRecord,
  Logger,
} from "../models";
import { ArtworkCache } from "../lib";
import { APP } from "../variables";
import { queue } from "async";
import * as steam from "../lib/helpers/steam";
import * as url from "../lib/helpers/url";
import * as appImage from "../lib/helpers/app-image";
import * as ids from "../lib/helpers/steam";
import {
  artworkTypes,
  artworkIdDict,
  invertedArtworkIdDict,
} from "../lib/artwork-types";
import { superTypesMap } from "../lib/parsers/available-parsers";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import {
  onlineProviders,
  imageProviderNames,
} from "../lib/image-providers/available-providers";
import { ParsersStore } from "./parsers-store";
import { SettingsStore } from "./settings-store";
import { ArtworkProviders } from "./artwork-providers";
import { SteamWriter } from "./steam-writer";
import { PreviewBuilder } from "./preview-builder";
import { addUniqueLocalImage, emptyPools } from "./image-pools";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface PreviewEngineOptions {
  logger: Logger;
  parsers: Pick<
    ParsersStore,
    | "getKnownSteamDirectories"
    | "executeFileParser"
    | "getAll"
    | "removeAllControllers"
  >;
  providers: Pick<
    ArtworkProviders,
    "retrieveUrls" | "stopUrlDownload" | "stopEvent"
  >;
  settings: Pick<SettingsStore, "get">;
  // Called for each new online image when images should be loaded ahead of
  // time (a UI measures them); nothing to do without a UI.
  onNewImage?: (image: ImageContent) => void;
  // Building the list and writing to Steam need the file system. A UI in
  // another process passes proxies to the main process's builder/writer.
  builder?: Pick<PreviewBuilder, "build">;
  writer?: Pick<SteamWriter, "save" | "exportSelection" | "readSelection">;
}

// The list of apps SRM is about to add to Steam ("preview"): generated from
// the parsers, with artwork pools filled from local files and online
// providers; plus saving that list to Steam, removing it, and "remove all".
export class PreviewEngine {
  private previewData: PreviewData;
  private previewVariables: PreviewVariables;
  private previewDataChanged: Subject<void>;
  private onlineImages: OnlineImages;
  private batchProgress: BehaviorSubject<{ update: string; batch: number }>;
  private sgdbToArt: SGDBToArt;

  private loggerService: Logger;
  private parsers: PreviewEngineOptions["parsers"];
  private providers: PreviewEngineOptions["providers"];
  private settings: PreviewEngineOptions["settings"];
  private onNewImage: (image: ImageContent) => void;
  private writer: Pick<
    SteamWriter,
    "save" | "exportSelection" | "readSelection"
  >;
  private builder: Pick<PreviewBuilder, "build">;

  constructor(options: PreviewEngineOptions) {
    this.loggerService = options.logger;
    this.parsers = options.parsers;
    this.providers = options.providers;
    this.settings = options.settings;
    this.onNewImage = options.onNewImage ?? (() => {});
    this.writer =
      options.writer ??
      new SteamWriter(options.logger, options.parsers, options.settings);
    this.builder =
      options.builder ??
      new PreviewBuilder(options.logger, options.parsers, options.settings);
    this.previewData = undefined;
    this.previewVariables = {
      listIsBeingSaved: false,
      listIsBeingGenerated: false,
      listIsBeingRemoved: false,
      listHasGenerated: false,
      numberOfQueriedImages: 0,
      numberOfListItems: 0,
    };
    this.previewDataChanged = new Subject<void>();
    this.batchProgress = new BehaviorSubject({ update: "", batch: -1 });
    this.onlineImages = emptyPools();
    this.providers.stopEvent.subscribe(() => {
      for (const artworkType of artworkTypes) {
        for (const imagePool in this.onlineImages[artworkType]) {
          this.onlineImages[artworkType][imagePool].retrieving = false;
        }
      }
      this.previewVariables.numberOfQueriedImages = 0;
      this.loggerService.info(this.lang.info.allImagesRetrieved, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.previewDataChanged.next();
    });
  }

  private get appSettings(): AppSettings {
    return this.settings.get();
  }

  get lang() {
    return APP.lang.preview.service;
  }

  getPreviewData() {
    return this.previewData;
  }

  getPreviewDataChange() {
    return this.previewDataChanged;
  }
  getBatchProgress() {
    return this.batchProgress.asObservable();
  }

  getPreviewVariables() {
    return this.previewVariables;
  }

  getOnlineImages() {
    return this.onlineImages;
  }

  // Generates the preview from the enabled parsers. Resolves once the list
  // is built; online artwork keeps arriving afterwards (see waitForImages).
  async generatePreviewData(): Promise<void> {
    if (this.previewVariables.listIsBeingGenerated)
      return this.loggerService.info(this.lang.info.listIsBeingGenerated, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
    else if (this.previewVariables.listIsBeingSaved)
      return this.loggerService.info(this.lang.info.listIsBeingSaved, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
    else if (this.previewVariables.listIsBeingRemoved)
      return this.loggerService.info(this.lang.info.listIsBeingRemoved, {
        invokeAlert: true,
        alertTimeout: 3000,
      });

    this.previewVariables.listIsBeingGenerated = true;
    this.providers.stopUrlDownload();
    await this.generatePreviewDataCallback();
  }

  // Resolves once no online artwork lookups are pending.
  async waitForImages(): Promise<void> {
    while (this.previewVariables.numberOfQueriedImages !== 0) {
      await sleep(50);
    }
  }

  getMatchFixes(title: string) {
    return sgdbSearch.retrievePossibleIds(title);
  }

  updateAppImages(imageKey: string, oldPool: string, artworkType: ArtworkType) {
    if (this.onlineImages[artworkType][oldPool]) {
      this.onlineImages[artworkType][imageKey] = _.cloneDeep(
        this.onlineImages[artworkType][oldPool],
      );
      this.onlineImages[artworkType][imageKey].retrieving = false;
      for (const providerType of onlineProviders) {
        this.onlineImages[artworkType][imageKey].online[
          providerType
        ].searchQueries = [imageKey];
        this.onlineImages[artworkType][imageKey].online[providerType].content =
          [];
      }
      if (imageKey != oldPool) {
        delete this.onlineImages[artworkType][oldPool];
      }
    } else {
      throw "Tried to call updateAppImages on a missing oldPool";
    }
  }

  updateLocalArtworkOnly(
    imageKey: string,
    artworkType: ArtworkType,
    excludeArtwork: boolean,
  ) {
    if (this.onlineImages[artworkType][imageKey]) {
      for (const providerType of onlineProviders) {
        this.onlineImages[artworkType][imageKey].online[
          providerType
        ].searchQueries = excludeArtwork ? [] : [imageKey];
        this.onlineImages[artworkType][imageKey].online[providerType].content =
          [];
      }
    }
  }

  saveData({
    batchWrite,
    removeAll,
  }: {
    batchWrite: boolean;
    removeAll: boolean;
  }): Promise<boolean> {
    if (this.previewVariables.listIsBeingSaved) {
      return Promise.resolve().then(() => {
        this.loggerService.info(this.lang.info.listIsBeingSaved, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return false;
      });
    } else if (!removeAll && this.previewVariables.numberOfListItems === 0) {
      return Promise.resolve().then(() => {
        this.loggerService.info(this.lang.info.listIsEmpty, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return false;
      });
    } else if (this.previewVariables.listIsBeingRemoved) {
      return Promise.resolve().then(() => {
        this.loggerService.info(this.lang.info.listIsBeingRemoved, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        return false;
      });
    }
    return this.runSave({ batchWrite, removeAll });
  }

  private async runSave(options: {
    batchWrite: boolean;
    removeAll: boolean;
  }): Promise<boolean> {
    this.previewVariables.listIsBeingSaved = true;
    try {
      const { ok, outcomes } = await this.writer.save(
        options.removeAll ? undefined : this.previewData,
        this.onlineImages,
        options,
        (progress) => this.batchProgress.next(progress),
      );
      if (ok && outcomes) {
        this.updatePreviewDataUrls(outcomes);
      }
      if (ok && options.removeAll) {
        this.clearPreviewData();
      }
      return ok;
    } finally {
      this.previewVariables.listIsBeingSaved = false;
    }
  }

  private updatePreviewDataUrls(outcomes: VDF_AllScreenshotsOutcomes) {
    for (const steamDirectory in outcomes) {
      for (const userId in outcomes[steamDirectory]) {
        for (const gridName in outcomes[steamDirectory][userId].successes) {
          const shortId = gridName.match(/^\d+/).toString();
          const longId = steam.lengthenAppId(shortId);
          const artworkType =
            invertedArtworkIdDict[gridName.replace(/^\d+/, "")];
          const steamImageUrl = url.encodeFile(
            outcomes[steamDirectory][userId].successes[gridName],
          );
          const matchedApps = Object.entries(
            this.previewData[steamDirectory][userId].apps,
          ).filter(([appId, app]) => {
            return app.changedId ? app.changedId == longId : appId == longId;
          });
          if (matchedApps.length && artworkType) {
            const [appId, app] = matchedApps[0];
            this.previewData[steamDirectory][userId].apps[appId].images[
              artworkType
            ].singleProviders.steam = {
              imageProvider: imageProviderNames.steam,
              imageUrl: steamImageUrl,
              imageRes: url.imageDimensions(steamImageUrl),
              loadStatus: "done",
            };
            this.setImageIndex(app, 0, artworkType);
          }
        }
      }
    }
    this.previewDataChanged.next();
  }

  // Image selection, per artwork type. (The UI resolves which type it is
  // showing; measuring/loading images for display happens in the UI.)
  setImageIndex(app: PreviewDataApp, index: number, artworkType: ArtworkType) {
    if (app) {
      appImage.setImageIndex(
        app.images[artworkType],
        this.onlineImages[artworkType],
        index,
      );
      this.previewDataChanged.next();
    }
  }

  getTotalLengthOfImages(app: PreviewDataApp, artworkType: ArtworkType) {
    if (app) {
      return appImage.getMaxLength(
        app.images[artworkType],
        this.onlineImages[artworkType],
      ).maxLength;
    }
    return 0;
  }

  getCurrentImage(app: PreviewDataApp, artworkType: ArtworkType) {
    return appImage.getCurrentImage(
      app.images[artworkType],
      this.onlineImages[artworkType],
    );
  }

  getImages(artworkType: ArtworkType) {
    return this.onlineImages[artworkType];
  }

  getImage(app: PreviewDataApp, index: number, artworkType: ArtworkType) {
    return appImage.getImage(
      app.images[artworkType],
      this.onlineImages[artworkType],
      index,
    );
  }

  getRanges(app: PreviewDataApp, artworkType: ArtworkType) {
    return appImage.getImageRanges(
      app.images[artworkType],
      this.onlineImages[artworkType],
    );
  }

  // Notify listeners after changing preview data in place.
  changed() {
    this.previewDataChanged.next();
  }

  // Removes every app in the current preview from Steam ("Remove from
  // Steam"); clears the preview if that worked.
  async removeAllInPreview(): Promise<boolean> {
    for (const directory in this.previewData) {
      for (const userId in this.previewData[directory]) {
        for (const appId in this.previewData[directory][userId].apps) {
          this.previewData[directory][userId].apps[appId].status = "remove";
        }
      }
    }
    const ok = await this.saveData({ removeAll: false, batchWrite: false });
    if (ok) {
      this.clearPreviewData();
    }
    return ok;
  }

  // Removes everything SRM ever added (shortcuts, artwork, categories,
  // compat tools, controller templates) from every known Steam install.
  async removeAllAdded(): Promise<boolean> {
    const steamDirectories = this.parsers.getKnownSteamDirectories();
    if (steamDirectories.length === 0) {
      this.loggerService.error(this.lang.errors.knownSteamDirListIsEmpty, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      return false;
    }
    const ok = await this.saveData({ removeAll: true, batchWrite: false });
    if (ok) {
      await this.parsers.removeAllControllers();
    }
    return ok;
  }

  clearPreviewData() {
    this.previewData = undefined;
    this.clearImageCache(false);
    this.previewVariables.numberOfListItems = 0;
    this.previewDataChanged.next();
  }

  private union(x: string[], y: string[]) {
    return _.union(x, y);
  }

  getAllCategories() {
    return this.previewData
      ? Object.entries(this.previewData)
          .map((dir) =>
            Object.entries(dir[1])
              .map((user) =>
                Object.entries(user[1].apps)
                  .map((app) => app[1].steamCategories)
                  .reduce(this.union, []),
              )
              .reduce(this.union, []),
          )
          .reduce(this.union, [])
      : [];
  }

  getAllParsers() {
    return this.previewData
      ? Object.entries(this.previewData)
          .map((dir) =>
            Object.entries(dir[1])
              .map((user) =>
                Object.entries(user[1].apps).map(
                  (app) => app[1].configurationTitle,
                ),
              )
              .reduce(this.union, []),
          )
          .reduce(this.union, [])
      : [];
  }

  // If settingsOnly is true then api filters are not applied
  private clearImageCache(settingsOnly: boolean) {
    for (const artworkType of artworkTypes) {
      for (const imageKey in this.onlineImages[artworkType]) {
        for (const provider of onlineProviders) {
          this.onlineImages[artworkType][imageKey].retrieving = false;
          this.onlineImages[artworkType][imageKey].online[provider] = {
            searchQueries: [],
            content: settingsOnly
              ? this.onlineImages[artworkType][imageKey].online[provider]
                  .content
              : [],
            imageProviderAPIs:
              this.onlineImages[artworkType][imageKey].online[provider]
                .imageProviderAPIs,
          };
        }
      }
    }
  }

  private async generatePreviewDataCallback() {
    // Let any pending artwork lookups wind down first.
    while (this.previewVariables.numberOfQueriedImages !== 0) {
      await sleep(100);
    }
    {
      this.previewData = undefined;
      this.loggerService.info(this.lang.info.executingParsers, {
        invokeAlert: true,
      });
      try {
        const result = await this.builder.build();
        for (const artworkType of artworkTypes) {
          this.onlineImages[artworkType] = result.onlineImages[artworkType];
        }
        if (result.previewData) {
          this.previewData = result.previewData;
          this.previewVariables.numberOfListItems = result.numberOfItems;
          this.sgdbToArt = result.sgdbToArt;
          for (const artworkType of artworkTypes) {
            this.downloadImageUrls(artworkType);
          }
        } else {
          this.previewVariables.numberOfListItems = 0;
          this.loggerService.info("Enabled parsers returned no apps", {
            invokeAlert: true,
            alertTimeout: 3000,
          });
        }

        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      } catch (error) {
        this.loggerService.error(this.lang.errors.fatalError, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        this.loggerService.error(error);
        this.previewVariables.listIsBeingGenerated = false;
        this.previewVariables.listHasGenerated = true;
        this.previewDataChanged.next();
      }
    }
  }

  downloadImageUrls(artworkType: ArtworkType, imKeys?: string[]) {
    if (!this.appSettings.offlineMode) {
      let allImagesRetrieved = true;
      let imageQueue = queue((task, callback) => callback());
      const imageKeys =
        imKeys && imKeys.length
          ? imKeys
          : Object.keys(this.onlineImages[artworkType]);
      for (let imageKey of imageKeys) {
        const imageByPool = this.onlineImages[artworkType][imageKey];
        if (imageByPool.retrieving) {
          continue;
        }
        const imageByProvider = imageByPool.online;
        const parserEnabledProviders = imageByPool.parserEnabledProviders;
        const imageProvidersForKey: OnlineProviderType[] = _.intersection(
          parserEnabledProviders,
          this.appSettings.enabledProviders,
        );
        this.previewVariables.numberOfQueriedImages += imageProvidersForKey
          .map((provider) => imageByProvider[provider].searchQueries.length)
          .reduce((x, y) => x + y, 0);
        let retrievingByProvider = Object.fromEntries(
          onlineProviders.map((x) => [
            x,
            imageProvidersForKey.includes(x) &&
              !!imageByProvider[x].searchQueries.length,
          ]),
        );
        imageByPool.retrieving = Object.values(retrievingByProvider).reduce(
          (x, y) => x || y,
          false,
        );
        for (let provider of imageProvidersForKey) {
          const image = imageByProvider[provider];
          if (image !== undefined && image.searchQueries.length) {
            allImagesRetrieved = false;
            for (let j = 0; j < image.searchQueries.length; j++) {
              this.providers.retrieveUrls(
                image.searchQueries[j],
                artworkType,
                image.imageProviderAPIs,
                provider,
                <K extends keyof ProviderCallbackEventMap>(
                  event: K,
                  data: ProviderCallbackEventMap[K],
                ) => {
                  switch (event) {
                    case "error":
                      {
                        let errorData =
                          data as ProviderCallbackEventMap["error"];
                        if (typeof errorData.error === "number") {
                          this.loggerService.error(
                            this.lang.errors.providerError__i.interpolate({
                              provider: errorData.provider,
                              title: errorData.title,
                              details: errorData.url
                                ? `${errorData.error}: ${errorData.url}`
                                : errorData.error,
                            }),
                          );
                        } else {
                          this.loggerService.error(
                            this.lang.errors.unknownProviderError__i.interpolate(
                              {
                                provider: errorData.provider,
                                title: errorData.title,
                                error: errorData.error,
                              },
                            ),
                          );
                        }
                      }
                      break;
                    case "timeout":
                      {
                        let timeoutData =
                          data as ProviderCallbackEventMap["timeout"];
                        this.loggerService.info(
                          this.lang.info.providerTimeout__i.interpolate({
                            time: timeoutData.time,
                            provider: timeoutData.provider,
                          }),
                          { invokeAlert: true, alertTimeout: 3000 },
                        );
                      }
                      break;
                    case "image":
                      imageQueue.push(null, () => {
                        let imageContent = (
                          data as ProviderCallbackEventMap["image"]
                        ).content;
                        let returnedProvider = (
                          data as ProviderCallbackEventMap["image"]
                        ).provider;
                        let skip = false;
                        let preInsert = false;
                        if (returnedProvider === "sgdb") {
                          const imageArtCache = (this.sgdbToArt[artworkType] ||
                            {})[imageContent.imageGameId];
                          preInsert =
                            imageArtCache &&
                            imageArtCache.artworkId ==
                              imageContent.imageArtworkId;
                          skip = imageContent.imageUrl.slice(-1) == "?"; // DMCA filter. Nintendo Sucks.
                        }
                        if (!skip) {
                          let newImage: ImageContent = this.addUniqueImage(
                            imageKey,
                            imageContent,
                            artworkType,
                            returnedProvider,
                            preInsert,
                          );
                          if (
                            newImage !== null &&
                            this.appSettings.previewSettings
                              .imageLoadStrategy == "loadPre"
                          ) {
                            this.onNewImage(newImage);
                          }
                        }
                        this.previewDataChanged.next();
                      });
                      break;
                    case "completed":
                      {
                        retrievingByProvider[provider] = false;
                        imageByPool.retrieving = Object.values(
                          retrievingByProvider,
                        ).reduce((x, y) => x || y);
                        if (
                          --this.previewVariables.numberOfQueriedImages === 0
                        ) {
                          allImagesRetrieved = true;
                          this.loggerService.info(
                            this.lang.info.allImagesRetrieved,
                            { invokeAlert: true, alertTimeout: 3000 },
                          );
                        }
                        this.previewDataChanged.next();
                      }
                      break;
                    default:
                      break;
                  }
                },
              );
            }
          }
        }
      }
      this.previewDataChanged.next();
      if (allImagesRetrieved) {
        this.loggerService.info(this.lang.info.allImagesRetrieved, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
      }
    } else this.previewDataChanged.next();
  }

  isImageUnique(
    imageKey: string,
    imageUrl: string,
    artworkType: ArtworkType,
    provider: OnlineProviderType,
  ) {
    return (
      this.onlineImages[artworkType][imageKey].online[
        provider
      ].content.findIndex((item) => item.imageUrl === imageUrl) === -1
    );
  }

  addUniqueImage(
    imageKey: string,
    content: ImageContent,
    artworkType: ArtworkType,
    provider: OnlineProviderType,
    preinsert?: boolean,
  ) {
    if (
      this.onlineImages[artworkType][imageKey] &&
      this.isImageUnique(imageKey, content.imageUrl, artworkType, provider)
    ) {
      if (preinsert) {
        this.onlineImages[artworkType][imageKey].online[
          provider
        ].content.unshift(content);
        return this.onlineImages[artworkType][imageKey].online[provider]
          .content[0];
      } else {
        this.onlineImages[artworkType][imageKey].online[provider].content.push(
          content,
        );
        return ((x) => x[x.length - 1])(
          this.onlineImages[artworkType][imageKey].online[provider].content,
        );
      }
    }
    return null;
  }

  addUniqueLocalImage(
    imageKey: string,
    content: ImageContent,
    artworkType: ArtworkType,
    provider: MultiLocalProviderType,
    preinsert?: boolean,
  ) {
    return addUniqueLocalImage(
      this.onlineImages,
      imageKey,
      content,
      artworkType,
      provider,
      preinsert,
    );
  }

  // Saves the chosen artwork of every app into <folder>/srm-image-choices.
  exportSelection(folder: string) {
    return this.writer.exportSelection(
      this.previewData,
      this.onlineImages,
      folder,
    );
  }

  async importSelection(packagePath: string) {
    {
      try {
        this.loggerService.info(this.lang.info.readingSelections, {
          invokeAlert: true,
          alertTimeout: 3000,
        });

        const read = await this.writer.readSelection(packagePath);
        if (read.ok === false) {
          this.loggerService.error(
            (read.invalidJson
              ? this.lang.errors.importJSONFailError__i
              : this.lang.errors.importFailError__i
            ).interpolate({ error: read.error }),
            { invokeAlert: true, alertTimeout: 3000 },
          );
          return;
        }
        let importedApps: string[] = [];
        for (const item of read.items) {
          this.addUniqueLocalImage(
            item.pool,
            {
              imageProvider: imageProviderNames.imported,
              imageUrl: item.imageUrl,
              loadStatus: "done",
            },
            item.artworkType,
            "imported",
          );
          if (!importedApps.includes(item.pool)) {
            importedApps.push(item.pool);
          }
        }
        for (const directory in this.previewData) {
          for (const userId in this.previewData[directory]) {
            for (const appId in this.previewData[directory][userId].apps) {
              const app: PreviewDataApp =
                this.previewData[directory][userId].apps[appId];
              for (const artworkType of artworkTypes) {
                const imageRanges = appImage.getImageRanges(
                  app.images[artworkType],
                  this.onlineImages[artworkType],
                );
                if (imageRanges.imported.start < imageRanges.imported.end) {
                  this.setImageIndex(
                    app,
                    imageRanges.imported.end - 1,
                    artworkType,
                  );
                }
              }
            }
          }
        }
        this.loggerService.success(
          this.lang.success.importSelectionsSuccess__i.interpolate({
            count: importedApps.length,
          }),
          { invokeAlert: true, alertTimeout: 3000 },
        );
      } catch (e) {
        if (e instanceof SyntaxError) {
          this.loggerService.error(
            this.lang.errors.importJSONFailError__i.interpolate({
              error: e.message,
            }),
            { invokeAlert: true, alertTimeout: 3000 },
          );
        } else {
          this.loggerService.error(
            this.lang.errors.importFailError__i.interpolate({
              error: e.message,
            }),
            { invokeAlert: true, alertTimeout: 3000 },
          );
        }
      }
    }
  }
}
