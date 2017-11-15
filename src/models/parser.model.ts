import { userAccountData } from './helpers.model';

export interface ParsedUserConfigurationFile {
    executableLocation: string,
    modifiedExecutableLocation: string,
    startInDirectory: string,
    filePath: string,
    extractedTitle: string,
    fuzzyTitle: string,
    finalTitle: string,
    argumentString: string,
    resolvedLocalImages: string[],
    resolvedLocalIcons: string[],
    onlineImageQueries: string[],
    steamCategories: string[],
    imagePool: string,
    resolvedDefaultImages: string[],
    defaultImage: string,
    localImages: string[],
    localIcons: string[]
}

export interface ParsedUserConfiguration {
    configurationTitle: string,
    imageProviders: string[],
    steamDirectory: string,
    appendArgsToExecutable: boolean,
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
        validationFn?: (inputData: string, suppressSlashError?: boolean) => null | string
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

export interface ParserVariableData {
    executableLocation: string,
    startInDirectory: string,
    steamDirectory: string,
    romDirectory: string,
    extractedTitle: string,
    fuzzyTitle: string,
    finalTitle: string,
    filePath: string
}

export type DirectoryVariables = 'EXEDIR' | 'ROMDIR' | 'STEAMDIR' | 'STARTINDIR' | 'FILEDIR';
export type NameVariables = 'EXENAME' | 'FILENAME';
export type ExtensionVariables = 'EXEEXT' | 'FILEEXT';
export type PathVariables = 'EXEPATH' | 'FILEPATH';
export type ParserVariables = 'TITLE' | 'FUZZYTITLE' | 'FINALTITLE';
export type OtherVariables = '/';

export type AllVariables = DirectoryVariables | NameVariables | ExtensionVariables | PathVariables | ParserVariables | OtherVariables;

export interface GenericParser {
    getParserInfo(): ParserInfo,
    execute: (directory: string, inputs: { [key: string]: any }, cache?: { [key: string]: any }) => Promise<ParsedData>
}