import {
  PreviewData,
  ParsedUserConfiguration,
  OnlineImages,
  AppSettings,
  SteamTree,
  SGDBToArt,
  ArtworkType,
  PreviewDataAppImage,
  initArtworkRecord,
  Logger,
} from "../models";
import { ArtworkCache } from "../lib";
import { APP } from "../variables";
import * as steam from "../lib/helpers/steam";
import * as url from "../lib/helpers/url";
import * as ids from "../lib/helpers/steam";
import { artworkTypes, artworkIdDict } from "../lib/artwork-types";
import { superTypesMap } from "../lib/parsers/available-parsers";
import * as _ from "lodash";
import { imageProviderNames } from "../lib/image-providers/available-providers";
import { ParsersStore } from "./parsers-store";
import { SettingsStore } from "./settings-store";
import { addUniqueLocalImage, emptyPools } from "./image-pools";

export interface BuildResult {
  // Absent when the parsers produced nothing to add.
  previewData?: PreviewData;
  numberOfItems: number;
  // Fresh artwork pools: search queries and local images, no online images.
  onlineImages: OnlineImages;
  // SteamGridDB artwork previously chosen per game (artworkCache.json).
  sgdbToArt?: SGDBToArt;
}

// Builds the preview list: runs the enabled parsers and turns their output
// into per-Steam-user apps with artwork pools. Reads parser inputs and Steam
// files, so it runs in the main process.
export class PreviewBuilder {
  constructor(
    private loggerService: Logger,
    private parsers: Pick<ParsersStore, "executeFileParser" | "getAll">,
    private settings: Pick<SettingsStore, "get">,
  ) {}

  private get appSettings(): AppSettings {
    return this.settings.get();
  }

  private get lang() {
    return APP.lang.preview.service;
  }

  // Throws if the parsers fail; logs (as the UI did) what was skipped.
  // `parserIds`: run just these parsers, enabled or not.
  async build({
    parserIds,
  }: { parserIds?: string[] } = {}): Promise<BuildResult> {
    const pools = emptyPools();
    let previewData;
    let data = await this.parsers.executeFileParser(
      ...(parserIds
        ? this.parsers.getAll().filter((c) => parserIds.includes(c.parserId))
        : []),
    );
    if (data.skipped.length > 0) {
      this.loggerService.info(
        this.lang.info.disabledConfigurations__i.interpolate({
          count: data.skipped.length,
        }),
        { invokeAlert: true, alertTimeout: 3000 },
      );
      for (let i = 0; i < data.skipped.length; i++) {
        this.loggerService.info(data.skipped[i]);
      }
    }

    if (data.invalid.length > 0) {
      this.loggerService.info(
        this.lang.info.invalidConfigurations__i.interpolate({
          count: data.invalid.length,
        }),
        { invokeAlert: true, alertTimeout: 3000 },
      );
      for (let i = 0; i < data.invalid.length; i++) {
        this.loggerService.info(data.invalid[i]);
      }
    }

    if (data.parsedData.parsedConfigs.length > 0) {
      if (data.parsedData.noUserAccounts) {
        this.loggerService.info(this.lang.info.noAccountsWarning, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
      } else {
        if (
          !this.appSettings.previewSettings.disableCategories &&
          !this.appSettings.autoKillSteam
        ) {
          this.loggerService.info(this.lang.info.shutdownSteam, {
            invokeAlert: true,
            alertTimeout: 3000,
          });
        }
        previewData = await this.createPreviewData(
          data.parsedData.parsedConfigs,
          pools,
        );
      }
    } else if (data.invalid.length === 0 && data.skipped.length === 0) {
      if (this.parsers.getAll().length === 0)
        this.loggerService.info(this.lang.info.noParserConfigurations, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
      else
        this.loggerService.info(this.lang.info.parserFoundNoFiles, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
    }
    if (!previewData || previewData.numberOfItems === 0) {
      return { numberOfItems: 0, onlineImages: pools };
    }
    const artworkCache = new ArtworkCache();
    await artworkCache.read();
    return {
      previewData: previewData.data,
      numberOfItems: previewData.numberOfItems,
      onlineImages: pools,
      sgdbToArt: artworkCache.sgdbToArt,
    };
  }

  private async createPreviewData(
    data: ParsedUserConfiguration[],
    pools: OnlineImages,
  ) {
    let steamTreeData = steam.generateTreeFromParsedConfig(data);
    let treeData: { gridData: SteamTree<any>; steamTreeData: SteamTree<any> };
    if (this.appSettings.previewSettings.retrieveCurrentSteamImages)
      treeData = await steam
        .getGridImagesForTree(steamTreeData)
        .then((gridData) => {
          return { gridData, steamTreeData };
        });
    else treeData = { gridData: steamTreeData, steamTreeData };

    let nonSteamShortcutsData = await steam
      .getNonSteamShortcutsData(treeData.steamTreeData)
      .then((shortcutData) => {
        return Object.assign(treeData, { shortcutData });
      });
    let shortcutsData = nonSteamShortcutsData.shortcutData.tree;
    let gridData = nonSteamShortcutsData.gridData.tree;
    let numberOfItems: number = 0;
    let previewData: PreviewData = {};

    for (let i = 0; i < data.length; i++) {
      let config = data[i];
      if (previewData[config.steamDirectory] === undefined)
        previewData[config.steamDirectory] = {};

      for (let j = 0; j < config.foundUserAccounts.length; j++) {
        let userAccount = config.foundUserAccounts[j];

        if (
          previewData[config.steamDirectory][userAccount.accountID] ===
          undefined
        ) {
          previewData[config.steamDirectory][userAccount.accountID] = {
            username: userAccount.name,
            excluded: data
              .map((x) => x.excluded)
              .reduce((x, y) => x.concat(y), []),
            apps: {},
          };
        } else if (
          previewData[config.steamDirectory][userAccount.accountID].username !==
          userAccount.name
        ) {
          previewData[config.steamDirectory][userAccount.accountID].username =
            `${previewData[config.steamDirectory][userAccount.accountID].username} | ${userAccount.name}`;
        }

        for (let k = 0; k < data[i].files.length; k++) {
          let file = config.files[k];
          let executableLocation = file.modifiedExecutableLocation;
          let title = file.titles.final;
          let appID: string = "";
          if (superTypesMap[config.parserType] !== "ArtworkOnly") {
            appID = steam.generateAppId(executableLocation, title);
          } else {
            appID = steam.lengthenAppId(executableLocation.replace(/\"/g, ""));
          }

          if (
            shortcutsData[config.steamDirectory][userAccount.accountID][
              appID
            ] !== undefined
          ) {
            if (
              shortcutsData[config.steamDirectory][userAccount.accountID][
                appID
              ]["icon"] !== undefined
            ) {
              if (
                file.localImages["icon"].indexOf(
                  shortcutsData[config.steamDirectory][userAccount.accountID][
                    appID
                  ]["icon"],
                ) === -1
              ) {
                file.localImages["icon"].unshift(
                  shortcutsData[config.steamDirectory][userAccount.accountID][
                    appID
                  ]["icon"],
                );
              }
            }
          }
          for (const artworkType of artworkTypes) {
            if (pools[artworkType][file.imagePool] === undefined) {
              pools[artworkType][file.imagePool] = {
                online: {
                  sgdb: {
                    searchQueries: file.onlineImageQueries,
                    imageProviderAPIs: config.imageProviderAPIs.sgdb,
                    content: [],
                  },
                  steamCDN: {
                    searchQueries: file.onlineImageQueries,
                    imageProviderAPIs: config.imageProviderAPIs.steamCDN || {},
                    content: [],
                  },
                },
                offline: { local: [], manual: [], imported: [] },
                retrieving: false,
                parserEnabledProviders: config.imageProviders,
              };
            } else {
              for (const provider of config.imageProviders) {
                let currentQueries =
                  pools[artworkType][file.imagePool].online[provider]
                    .searchQueries;
                pools[artworkType][file.imagePool].online[
                  provider
                ].imageProviderAPIs = config.imageProviderAPIs[provider];
                pools[artworkType][file.imagePool].online[
                  provider
                ].searchQueries = _.union(
                  currentQueries,
                  file.onlineImageQueries,
                );
              }
            }
          }

          if (
            previewData[config.steamDirectory][userAccount.accountID].apps[
              appID
            ] === undefined
          ) {
            let images: Record<ArtworkType, PreviewDataAppImage> =
              initArtworkRecord<PreviewDataAppImage>(() => null);
            for (const artworkType of artworkTypes) {
              const steamImage =
                gridData[config.steamDirectory][userAccount.accountID][
                  ids.shortenAppId(appID).concat(artworkIdDict[artworkType])
                ];
              const steamImageUrl = steamImage
                ? url.encodeFile(steamImage)
                : undefined;
              images[artworkType] = {
                singleProviders: {
                  steam: steamImage
                    ? {
                        imageProvider: imageProviderNames.steam,
                        imageUrl: steamImageUrl,
                        imageRes: url.imageDimensions(steamImageUrl),
                        loadStatus: "done",
                      }
                    : undefined,
                  artworkBackup: file.backupImage[artworkType]
                    ? {
                        imageProvider: imageProviderNames.artworkBackup,
                        imageUrl: file.backupImage[artworkType],
                        imageRes: url.imageDimensions(
                          file.backupImage[artworkType],
                        ),
                        loadStatus: "done",
                      }
                    : undefined,
                },
                default: file.defaultImage[artworkType]
                  ? {
                      imageProvider: imageProviderNames.default,
                      imageUrl: file.defaultImage[artworkType],
                      imageRes: url.imageDimensions(
                        file.defaultImage[artworkType],
                      ),
                      loadStatus: "done",
                    }
                  : undefined,
                imagePool: file.imagePool,
                imageIndex: 0,
              };
              for (let localUrl of file.localImages[artworkType]) {
                addUniqueLocalImage(
                  pools,
                  file.imagePool,
                  {
                    imageProvider: imageProviderNames.local,
                    imageUrl: localUrl,
                    imageRes: url.imageDimensions(localUrl),
                    loadStatus: "done",
                  },
                  artworkType,
                  "local",
                );
              }
            }

            previewData[config.steamDirectory][userAccount.accountID].apps[
              appID
            ] = {
              entryId: numberOfItems++,
              status: "add",
              configurationTitle: config.configurationTitle,
              parserId: config.parserId,
              parserType: config.parserType,
              steamCategories: file.steamCategories,
              startInDirectory: file.startInDirectory,
              onlineProviders: config.imageProviders,
              drmProtect: config.drmProtect,
              argumentString: file.argumentString,
              filePath: file.filePath,
              title: file.titles.final,
              extractedTitle: file.titles.extracted,
              sortAsTitle: file.sortAsTitle,
              steamInputEnabled: config.steamInputEnabled,
              controllers: config.controllers,
              compatToolName: file.compatToolName,
              images: images,
              overlayImages: config.overlayImages,
              executableLocation,
            };
          } else {
            let currentCategories =
              previewData[config.steamDirectory][userAccount.accountID].apps[
                appID
              ].steamCategories;
            previewData[config.steamDirectory][userAccount.accountID].apps[
              appID
            ].steamCategories = _.union(
              currentCategories,
              file.steamCategories,
            );
          }
        }
      }
    }
    return { numberOfItems: numberOfItems, data: previewData };
  }
}
