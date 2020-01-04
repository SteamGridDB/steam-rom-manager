import { FuzzyListTimestamps } from "./fuzzy.model";

export interface PreviewSettings {
    retrieveCurrentSteamImages: boolean,
    imageZoomPercentage: number,
    preload: boolean,
    imageTypes: string[]
}

export interface AppSettings {
    fuzzyMatcher: {
        timestamps: FuzzyListTimestamps,
        verbose: boolean,
        filterProviders: boolean
    },
    language: string,
    offlineMode: boolean,
    enabledProviders: string[],
    previewSettings: PreviewSettings,
    navigationWidth: number,
    clearLogOnTest: boolean,
    knownSteamDirectories: string[]
}
