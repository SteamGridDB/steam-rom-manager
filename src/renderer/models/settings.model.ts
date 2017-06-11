export interface FuzzyListTimestamps {
    check: number,
    download: number
}

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
    offlineMode: boolean,
    previewSettings: PreviewSettings,
    knownSteamDirectories: string[]
}