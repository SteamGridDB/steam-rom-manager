import { ParsedSuccess } from './parser.model';

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
  success: (ParsedSuccess & {
    fuzzyTitle: string,
    })[],
  failed: string[]
}

export interface FuzzyMatcherOptions {
    removeCharacters?: boolean,
    removeBrackets?: boolean,
    replaceDiacritics?: boolean
}
