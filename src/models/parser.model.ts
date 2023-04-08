import { userAccountData, StringLiteralArray } from './helpers.model';
import { Controllers } from './controllers.model';
import { ImageProviderAPI } from './user-configuration.model';

export interface StringMap {
  [key: string]: any
}

export interface ParsedUserConfigurationFile extends StringMap {
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
  resolvedDefaultIcons: string[],
  defaultImage: string,
  defaultTallImage: string,
  defaultHeroImage: string,
  defaultLogoImage: string,
  defaultIcon: string,
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
  imageProviderAPIs: ImageProviderAPI,
  controllers: Controllers,
  steamDirectory: string,
  appendArgsToExecutable: boolean,
  shortcutPassthrough: boolean,
  foundUserAccounts: userAccountData[],
  missingUserAccounts: string[],
  files: ParsedUserConfigurationFile[],
  failed: string[],
  excluded: string[]
}

export interface ParserInputField {
  [inputKey: string]: {
    label: string,
    placeholder?: string,
    inputType: 'text' | 'path' | 'dir' | 'toggle',
    info?: string,
    forcedInput?: string,
    validationFn?: (inputData: any, suppressSlashError?: boolean) => null | string
  }
}

export interface ParserInfo {
  title: string,
  info?: string,
  inputs?: ParserInputField
}


// TODO Split this up more sanely into ImporterParsedData and ManagerParsedData
export interface ParsedData {
  executableLocation?: string // Used by platform parsers in launcher mode
  success: {
    extractedTitle: string,
    filePath?: string, // Used by ROM parsers and platform parsers in executable mode
    extractedAppId?: string // Used by artwork only parsers
    launchOptions?: string, // Used by platform parsers
    startInDirectory?: string, //Used by manual parsers and apps the start in a different directory than the executable
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
  romsDirectoryGlobal: string,
  retroarchPath: string,
  raCoresDirectory: string,
  localImagesDirectory: string
}


const directoryVariables = StringLiteralArray(['EXEDIR','ROMDIR','STEAMDIR','STARTINDIR','FILEDIR']);
const nameVariables = StringLiteralArray(['EXENAME','FILENAME']);
const extensionVariables = StringLiteralArray(['EXEEXT','FILEEXT']);
const pathVariables = StringLiteralArray(['EXEPATH','FILEPATH']);
const parserVariables = StringLiteralArray(['TITLE','FUZZYTITLE','FINALTITLE']);
const environmentVariables = StringLiteralArray(['/','SRMDIR','STEAMDIRGLOBAL','ROMSDIRGLOBAL','RETROARCHPATH','RACORES','LOCALIMAGESDIR']);

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
