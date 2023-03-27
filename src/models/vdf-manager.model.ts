import { VDF_ScreenshotsFile, VDF_ShortcutsFile, VDF_AddedItemsFile } from '../lib';

export interface VDF_ListItem {
  shortcuts: VDF_ShortcutsFile,
  screenshots: VDF_ScreenshotsFile,
  addedItems: VDF_AddedItemsFile
}

export interface VDF_ListData {
  [steamDirectory: string]: {
    [userId: string]: VDF_ListItem
  }
}

export interface VDF_ScreenshotsData {
  [appId: string]: {
    title: string,
    url: string
  } | string
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
  [key: string]: string | undefined
}

export interface VDF_ExtraneousItemsData {
  [userId: string]: string[] //list of extraneous (long) appids for userid
}

export type SteamDirectory = string;
