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
    parserType: string,
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
        filePath?: string,
        extractedTitle: string,
        extractedAppId?: string
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
    filePath: string,
    steamDirectoryGlobal: string,
    retroarchPath: string
}


const directoryVariables = StringLiteralArray(['EXEDIR','ROMDIR','STEAMDIR','STARTINDIR','FILEDIR']);
const nameVariables = StringLiteralArray(['EXENAME','FILENAME']);
const extensionVariables = StringLiteralArray(['EXEEXT','FILEEXT']);
const pathVariables = StringLiteralArray(['EXEPATH','FILEPATH']);
const parserVariables = StringLiteralArray(['TITLE','FUZZYTITLE','FINALTITLE']);
const environmentVariables = StringLiteralArray(['/','SRMDIR','STEAMDIRGLOBAL','RETROARCHPATH']);

export type DirectoryVariables = (typeof directoryVariables)[number];
export type NameVariables = (typeof nameVariables)[number];
export type ExtensionVariables = (typeof extensionVariables)[number];
export type PathVariables = (typeof pathVariables)[number];
export type ParserVariables = (typeof parserVariables)[number];
export type EnvironmentVariables = (typeof environmentVariables)[number];



export type AllVariables = DirectoryVariables | NameVariables | ExtensionVariables | PathVariables | ParserVariables | EnvironmentVariables;


export const isEnvironmentVariable = (x: any): x is EnvironmentVariables => environmentVariables.indexOf(x as EnvironmentVariables)>=0;
export const isNameVariable = (x: any): x is NameVariables => nameVariables.indexOf(x as NameVariables)>=0;
export const isExtensionVariable = (x: any): x is ExtensionVariables => extensionVariables.indexOf(x as ExtensionVariables)>=0;
export const isPathVariable = (x: any): x is PathVariables => pathVariables.indexOf(x as PathVariables)>=0;
export const isParserVariable = (x: any): x is ParserVariables => parserVariables.indexOf(x as ParserVariables)>=0;
export const isDirectoryVariable = (x: any): x is DirectoryVariables => directoryVariables.indexOf(x as DirectoryVariables)>=0;
export const isVariable = (x: any): x is AllVariables => isEnvironmentVariable(x)||isNameVariable(x)||isExtensionVariable(x)||isPathVariable(x)||isParserVariable(x)||isDirectoryVariable(x);

export interface GenericParser {
    getParserInfo(): ParserInfo,
    execute: (directories:string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) => Promise<ParsedData>
}
