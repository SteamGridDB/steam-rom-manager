import { FuzzyListTimestamps } from "./fuzzy.model";

export interface PreviewSettings {
    imageZoomPercentage: number,
    preload: boolean
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
    knownSteamDirectories: string[]
}