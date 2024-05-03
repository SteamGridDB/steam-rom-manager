import { FuzzyListTimestamps } from "./fuzzy.model";

export interface PreviewSettings {
    retrieveCurrentSteamImages: boolean,
    deleteDisabledShortcuts: boolean,
    imageZoomPercentage: number,
    preload: boolean,
    imageTypes: string[],
    hideUserAccount: boolean
}

export interface AppSettings {
  fuzzyMatcher: {
      timestamps: FuzzyListTimestamps,
      verbose: boolean,
      filterProviders: boolean
  },
  environmentVariables: {
    steamDirectory: string,
    userAccounts: string,
    romsDirectory: string,
    retroarchPath: string,
    localImagesDirectory: string,
    raCoresDirectory: string
  },
  language: string,
  theme: string,
  emudeckInstall: boolean,
  autoUpdate: boolean,
  offlineMode: boolean,
  enabledProviders: string[],
  batchDownloadSize: number,
  previewSettings: PreviewSettings,
  navigationWidth: number,
  clearLogOnTest: boolean
}
