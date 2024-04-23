import { VDF_ScreenshotsFile, VDF_ShortcutsFile, VDF_AddedItemsFile, VDF_Error } from '../lib';

export interface VDF_ListItem {
  shortcuts: VDF_ShortcutsFile,
  screenshots: VDF_ScreenshotsFile,
  addedItems: VDF_AddedItemsFile,
}

export interface VDF_ListData {
  [steamDirectory: string]: {
    [userId: string]: VDF_ListItem
  }
}

export interface VDF_ScreenshotItem {
  title: string,
  url: string,
  artworkType: string,
  sgdbId?: string,
  drmProtect?: boolean
}

export interface VDF_ScreenshotsData {
  [appId: string]: VDF_ScreenshotItem | string
}

export interface VDF_ScreenshotsOutcome {
  error: VDF_Error,
  successes: {
    [gridName: string]: string // written url
  }
}

export interface VDF_AllScreenshotsOutcomes {
  [steamDirectory: string]: {
    [userId: string]: VDF_ScreenshotsOutcome
  }
}

export interface VDF_ShortcutsItem {
  appid: number,
  appname: string,
  exe: string,
  StartDir: string,
  LaunchOptions: string,
  icon: string,
  tags: string[]
}

export interface VDF_AddedItemsData {
  version?: number,
  addedApps: {
    [appId: string]: {
      parserId: string,
      artworkOnly: boolean,
      categories: string[]
    } | undefined
  }
}

export interface SGDBToArt {
  [artworkType: string]: {
    [sgdbId: string]: {
      artworkId: string,
      appId: string
    }
  }
}

export interface ArtworkCacheData {
  version?: number,
  sgdbToArt: SGDBToArt
}

export interface VDF_ExtraneousItemsData {
  [steamDirectory: string]: {
    [userId: string]: string[] //list of extraneous (long) appids for userid
  }
}

export interface VDF_AddedCategoriesData {
  [steamDirectory: string]: {
    [userId: string]: {
      [shortAppId: string]: string[] //list of categories app was added to
    }
  }
}

export type SteamDirectory = string;
