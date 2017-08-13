import { userAccountData } from './steam-id-helpers.model';

export interface UserConfiguration {
    parserType: string,
    configTitle: string,
    steamCategory: string,
    executableLocation: string,
    romDirectory: string,
    steamDirectory: string,
    userAccounts: {
        specifiedAccounts: string,
        skipWithMissingDataDir: boolean
    },
    parserInputs: { [inputKey: string]: string },
    fuzzyMatch: {
        use: boolean,
        removeCharacters: boolean,
        removeBrackets: boolean
    },
    onlineImageQueries: string,
    imageProviders: string[],
    executableArgs: string,
    appendArgsToExecutable: boolean,
    localImages: string,
    localIcons: string,
    titleModifier: string,
    enabled: boolean,
    advanced: boolean
}

export interface ParsedUserConfigurationFile {
    executableLocation: string,
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

export interface Parser {
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
    getParser(): Parser,
    execute: (directory: string, inputs: { [key: string]: any }, cache?: { [key: string]: any }, keepRelative?: boolean) => Promise<ParsedData>
}