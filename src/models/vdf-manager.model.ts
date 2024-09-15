import { ArtworkType, SteamList } from ".";
import {
  VDF_ScreenshotsFile,
  VDF_ShortcutsFile,
  VDF_AddedItemsFile,
  VDF_Error,
} from "../lib";

export interface VDF_ListItem {
  shortcuts: VDF_ShortcutsFile;
  screenshots: VDF_ScreenshotsFile;
  addedItems: VDF_AddedItemsFile;
}

export type VDF_ListData = SteamList<VDF_ListItem>;

export interface VDF_ScreenshotItem {
  title: string;
  url: string;
  artworkType: ArtworkType;
  sgdbId?: string;
  drmProtect?: boolean;
}

export interface VDF_ScreenshotsData {
  [appId: string]: VDF_ScreenshotItem | string;
}

export interface VDF_ScreenshotsOutcome {
  error: VDF_Error;
  successes: {
    [gridName: string]: string; // written url
  };
}

export type VDF_AllScreenshotsOutcomes = SteamList<VDF_ScreenshotsOutcome>;

export interface VDF_ShortcutsItem {
  appid: number;
  appname: string;
  exe: string;
  StartDir: string;
  LaunchOptions: string;
  icon: string;
  tags: string[];
}

export interface VDF_AddedItemsData {
  version?: number;
  addedApps: {
    [appId: string]:
      | {
          parserId: string;
          artworkOnly: boolean;
          categories: string[];
        }
      | undefined;
  };
}

export type SGDBToArt = Record<
  ArtworkType,
  {
    [sgdbId: string]: {
      artworkId: string;
      appId: string;
    };
  }
>;

export interface ArtworkCacheData {
  version?: number;
  sgdbToArt: SGDBToArt;
}

export type VDF_ExtraneousItemsData = SteamList<string[]>; //list of extraneous (long) appids for userid

export type VDF_AddedCategoriesData = SteamList<{
  [shortAppId: string]: string[]; // list of categories app was added to
}>;

export type SteamDirectory = string;
