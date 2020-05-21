import { userAccountData, StringLiteralArray } from './helpers.model';

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
    resolvedLocalTallImages: string[],
    resolvedLocalHeroImages: string[],
    resolvedLocalLogoImages: string[],
    resolvedLocalIcons: string[],
    onlineImageQueries: string[],
    steamCategories: string[],
    imagePool: string,
    resolvedDefaultImages: string[],
    resolvedDefaultTallImages: string[],
    resolvedDefaultHeroImages: string[],
    resolvedDefaultLogoImages: string[],
    defaultImage: string,
    defaultTallImage: string,
    defaultHeroImage: string,
    defaultLogoImage: string,
    localImages: string[],
    localTallImages: string[],
    localHeroImages: string[],
    localLogoImages: string[],
    localIcons: string[]
}

export interface ParsedUserConfiguration {
    configurationTitle: string,
    parserId: string,
    imageProviders: string[],
    steamDirectory: string,
    appendArgsToExecutable: boolean,
    shortcutPassthrough: boolean,
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


const directoryVariables = StringLiteralArray(['EXEDIR','ROMDIR','STEAMDIR','STARTINDIR','FILEDIR']);
const nameVariables = StringLiteralArray(['EXENAME','FILENAME']);
const extensionVariables = StringLiteralArray(['EXEEXT','FILEEXT']);
const pathVariables = StringLiteralArray(['EXEPATH','FILEPATH']);
const parserVariables = StringLiteralArray(['TITLE','FUZZYTITLE','FINALTITLE']);
const environmentVariables = StringLiteralArray(['/','SRMDIR']);

export type DirectoryVariables = (typeof directoryVariables)[number];
export type NameVariables = (typeof nameVariables)[number];
export type ExtensionVariables = (typeof extensionVariables)[number];
export type PathVariables = (typeof pathVariables)[number];
export type ParserVariables = (typeof parserVariables)[number];
export type EnvironmentVariables = (typeof environmentVariables)[number];



export type AllVariables = DirectoryVariables | NameVariables | ExtensionVariables | PathVariables | ParserVariables | EnvironmentVariables;


export const isEnvironmentVariable = (x: any): x is EnvironmentVariables => x in environmentVariables;
export const isVariable = (x: any): x is AllVariables => x in directoryVariables||x in nameVariables||x in extensionVariables||x in pathVariables||x in parserVariables||x in environmentVariables;

export interface GenericParser {
    getParserInfo(): ParserInfo,
    execute: (directory: string, inputs: { [key: string]: any }, cache?: { [key: string]: any }) => Promise<ParsedData>
}
