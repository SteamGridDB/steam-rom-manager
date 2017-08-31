import { userAccountData } from './steam-id-helpers.model';

export interface ParsedUserConfigurationFile {
    executableLocation: string,
    startInDirectory: string,
    filePath: string,
    extractedTitle: string,
    fuzzyTitle: string,
    finalTitle: string,
    fuzzyFinalTitle: string,
    argumentString: string,
    resolvedLocalImages: string[],
    resolvedLocalIcons: string[],
    onlineImageQueries: string[],
    localImages: string[],
    localIcons: string[]
}

export interface ParsedUserConfiguration {
    steamCategories: string[],
    imageProviders: string[],
    steamDirectory: string,
    foundUserAccounts: userAccountData[],
    missingUserAccounts: string[],
    files: ParsedUserConfigurationFile[],
    failed: string[]
}

export interface ParserInputField {
    [inputKey: string]: {
        label: string,
        info?: string,
        forcedInput?: string,
        validationFn?: (inputData: string) => null | string
    }
}

export interface ParserInfo {
    title: string,
    info?: string,
    inputs?: ParserInputField
}

export interface ParsedData {
    success: {
        filePath: string,
        extractedTitle: string
    }[],
    failed: string[]
}

export interface GenericParser {
    getParserInfo(): ParserInfo,
    execute: (directory: string, inputs: { [key: string]: any }, cache?: { [key: string]: any }, keepRelative?: boolean) => Promise<ParsedData>
}