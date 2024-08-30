import { OnlineProviderType } from ".";
import { imageLoadStrategies } from "../lib/image-providers/available-providers";
import { FuzzyListTimestamps } from "./fuzzy.model";

export type imageLoadStrategy = (typeof imageLoadStrategies)[number];

export interface PreviewSettings {
  retrieveCurrentSteamImages: boolean;
  disableCategories: boolean;
  deleteDisabledShortcuts: boolean;
  imageZoomPercentage: number;
  imageLoadStrategy: imageLoadStrategy;
  imageTypes: string[];
  hideUserAccount: boolean;
}

export interface AppSettings {
  fuzzyMatcher: {
    timestamps: FuzzyListTimestamps;
    verbose: boolean;
    filterProviders: boolean;
  };
  environmentVariables: {
    steamDirectory: string;
    userAccounts: string[];
    romsDirectory: string;
    retroarchPath: string;
    localImagesDirectory: string;
    raCoresDirectory: string;
  };
  language: string;
  theme: string;
  emudeckInstall: boolean;
  autoUpdate: boolean;
  offlineMode: boolean;
  enabledProviders: OnlineProviderType[];
  batchDownloadSize: number;
  dnsServers: string[];
  previewSettings: PreviewSettings;
  navigationWidth: number;
  clearLogOnTest: boolean;
  autoKillSteam: boolean;
  autoRestartSteam: boolean;
}
