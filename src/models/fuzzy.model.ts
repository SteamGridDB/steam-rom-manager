export interface FuzzyListTimestamps {
    check: number,
    download: number
}

export interface FuzzyInfoData {
    info: FuzzyInfo,
    stringA?: string,
    stringB?: string
}

export interface FuzzyErrorData {
    isFatal: boolean,
    error: FuzzyError,
    errorMsg?: string
}

export interface FuzzyTimestampData extends FuzzyListTimestamps { }

export interface FuzzyEventMap {
    info: FuzzyInfoData,
    error: FuzzyErrorData,
    newTimestamps: FuzzyTimestampData
}

export type FuzzyInfo =
    'downloading' |
    'successfulDownload' |
    'checkingIfListIsUpToDate' |
    'listIsOutdated' |
    'listIsUpToDate' |
    'match' |
    'equal' |
    'notEqual';

export type FuzzyError =
    'totalGamesIsUndefined' |
    'unknownError';

export type FuzzyEventCallback = <K extends keyof FuzzyEventMap>(event: K, data: FuzzyEventMap[K]) => void;

export interface ParsedDataWithFuzzy {
  executableLocation?: string // Used by platform parsers in launcher mode
  success: {
    extractedTitle: string,
    fuzzyTitle: string,
    filePath?: string, // Used by ROM parsers and platform parsers in executable mode
    extractedAppId?: string, // Used by artwork only parsers
    launchOptions?: string, // Used by platform parsers
    startInDirectory?: string, //Used by manual parsers and apps the start in a different directory than the executable
    appendArgsToExecutable?: boolean //Used by manual parsers
  }[],
  failed: string[]
}

export interface FuzzyMatcherOptions {
    removeCharacters?: boolean,
    removeBrackets?: boolean,
    replaceDiacritics?: boolean
}
