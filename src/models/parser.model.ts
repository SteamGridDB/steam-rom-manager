import { userAccountData, StringLiteralArray } from "./helpers.model";
import { Controllers } from "./controllers.model";
import { ImageProviderAPI } from "./user-configuration.model";
import { OnlineProviderType, ArtworkType, SelectItem } from ".";

export interface StringMap {
  [key: string]: any;
}

export interface ParsedUserConfigurationFile extends StringMap {
  executableLocation: string;
  modifiedExecutableLocation: string;
  startInDirectory: string;
  filePath: string;
  extractedTitle: string;
  fuzzyTitle: string;
  finalTitle: string;
  argumentString: string;
  appendArgsToExecutable: boolean;
  onlineImageQueries: string[];
  steamCategories: string[];
  imagePool: string;
  defaultImage: Record<ArtworkType, string>;
  backupImage: Record<ArtworkType, string>;
  localImages: Record<ArtworkType, string[]>;
  resolvedDefaultImages: Record<ArtworkType, string[]>;
  resolvedLocalImages: Record<ArtworkType, string[]>;
}

export interface ParsedUserConfiguration {
  configurationTitle: string;
  parserId: string;
  parserType: ParserType;
  drmProtect: boolean;
  imageProviders: OnlineProviderType[];
  imageProviderAPIs: ImageProviderAPI;
  controllers: Controllers;
  steamInputEnabled: SteamInputEnabled;
  steamDirectory: string;
  shortcutPassthrough: boolean;
  foundUserAccounts: userAccountData[];
  missingUserAccounts: string[];
  files: ParsedUserConfigurationFile[];
  failed: string[];
  excluded: { exceptionKey: string; filePath: string }[];
}
const inputTypes = StringLiteralArray(["text","path","dir","toggle","multiselect"]);
export type ParserInputType = (typeof inputTypes)[number];
export interface ParserInputField {
  [inputKey: string]: {
    label: string;
    placeholder?: string;
    inputType: ParserInputType;
    allowedValues?: SelectItem[];
    initialValue?: string[] | string;
    hidden?: boolean;
    required?: boolean;
    important?: boolean;
    info?: string;
    validationFn?: (inputData: any) => null | string;
  };
}

// TODO Split this up more sanely into ImporterParsedData and ManagerParsedData
export interface ParsedSuccess {
  extractedTitle: string;
  filePath?: string; // Used by ROM parsers, and platform parsers in executable mode
  extractedAppId?: string; // Used by artwork only parsers
  launchOptions?: string; // Used by platform parsers in launcher mode
  fileLaunchOptions?: string; // Used by platform parsers executable mode
  startInDirectory?: string; //Used by manual parsers and parsers whose apps start in a different directory than the executable,
  appendArgsToExecutable?: boolean; //Used by manual parsers
}
export interface ParsedData {
  executableLocation?: string; // Used by platform parsers in launcher mode
  success: ParsedSuccess[];
  failed: string[];
}

export interface ParserVariableData {
  configTitle: string,
  executableLocation: string;
  startInDirectory: string;
  steamDirectory: string;
  romDirectory: string;
  extractedTitle: string;
  fuzzyTitle: string;
  finalTitle: string;
  filePath: string;
  steamDirectoryGlobal: string;
  romsDirectoryGlobal: string;
  userAccountsGlobal: string;
  retroarchPath: string;
  raCoresDirectory: string;
  localImagesDirectory: string;
}

const directoryVariables = StringLiteralArray([
  "EXEDIR",
  "ROMDIR",
  "STEAMDIR",
  "STARTINDIR",
  "FILEDIR",
]);
const nameVariables = StringLiteralArray(["EXENAME", "FILENAME"]);
const extensionVariables = StringLiteralArray(["EXEEXT", "FILEEXT"]);
const pathVariables = StringLiteralArray(["EXEPATH", "FILEPATH"]);
const parserVariables = StringLiteralArray([
  "TITLE",
  "FUZZYTITLE",
  "FINALTITLE",
  "PARSERTITLE"
]);
const environmentVariables = StringLiteralArray([
  "/",
  "SRMDIR",
  "STEAMDIRGLOBAL",
  "ACCOUNTSGLOBAL",
  "ROMSDIRGLOBAL",
  "RETROARCHPATH",
  "RACORES",
  "LOCALIMAGESDIR",
]);

export type DirectoryVariables = (typeof directoryVariables)[number];
export type NameVariables = (typeof nameVariables)[number];
export type ExtensionVariables = (typeof extensionVariables)[number];
export type PathVariables = (typeof pathVariables)[number];
export type ParserVariables = (typeof parserVariables)[number];
export type EnvironmentVariables = (typeof environmentVariables)[number];

const steamInputEnabled = StringLiteralArray(["0", "1", "2"]); // 0 disabled, 1 global settings, 2 enabled
export type SteamInputEnabled = (typeof steamInputEnabled)[number];

export type ParserType =
  | "Glob"
  | "Glob-regex"
  | "Manual"
  | "Amazon Games"
  | "Epic"
  | "Legendary"
  | "GOG Galaxy"
  | "itch.io"
  | "Steam"
  | "Non-SRM Shortcuts"
  | "UPlay"
  | "UWP"
  | "EA Desktop"
  | "Battle.net";
export type SuperType = "Manual" | "ArtworkOnly" | "ROM" | "Platform";

export interface ParserInfo {
  title: ParserType;
  info?: string;
  inputs?: ParserInputField;
}

export type AllVariables =
  | DirectoryVariables
  | NameVariables
  | ExtensionVariables
  | PathVariables
  | ParserVariables
  | EnvironmentVariables;

export const isEnvironmentVariable = (x: any): x is EnvironmentVariables =>
  environmentVariables.indexOf(x as EnvironmentVariables) >= 0;
export const isNameVariable = (x: any): x is NameVariables =>
  nameVariables.indexOf(x as NameVariables) >= 0;
export const isExtensionVariable = (x: any): x is ExtensionVariables =>
  extensionVariables.indexOf(x as ExtensionVariables) >= 0;
export const isPathVariable = (x: any): x is PathVariables =>
  pathVariables.indexOf(x as PathVariables) >= 0;
export const isParserVariable = (x: any): x is ParserVariables =>
  parserVariables.indexOf(x as ParserVariables) >= 0;
export const isDirectoryVariable = (x: any): x is DirectoryVariables =>
  directoryVariables.indexOf(x as DirectoryVariables) >= 0;
export const isVariable = (x: any): x is AllVariables =>
  isEnvironmentVariable(x) ||
  isNameVariable(x) ||
  isExtensionVariable(x) ||
  isPathVariable(x) ||
  isParserVariable(x) ||
  isDirectoryVariable(x);

export interface GenericParser {
  getParserInfo(): ParserInfo;
  execute: (
    directories: string[],
    inputs: { [key: string]: any },
    cache?: { [key: string]: any },
  ) => Promise<ParsedData>;
}
