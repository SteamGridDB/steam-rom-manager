import { Controllers } from './controllers.model';
import { StringMap, ParserType } from './parser.model';

export interface ImageProviderAPI {
  [imageProvider: string]: {
    [apiInputName: string]: string | string[] | boolean
  }
}

export interface UserAccountsInfo {
  specifiedAccounts: string,
  skipWithMissingDataDir: boolean,
  useCredentials: boolean
}

export interface UserConfiguration {
  parserType: ParserType,
  configTitle: string,
  parserId: string,
  steamCategory: string,
  executable: {
    path: string,
    shortcutPassthrough: boolean,
    appendArgsToExecutable: boolean,
  },
  executableModifier: string,
  romDirectory: string,
  steamDirectory: string,
  startInDirectory: string,
  userAccounts: UserAccountsInfo,
  parserInputs: { [inputKey: string]: string | boolean },
  titleFromVariable: {
    limitToGroups: string,
    skipFileIfVariableWasNotFound: boolean,
    caseInsensitiveVariables: boolean,
    tryToMatchTitle: boolean
  },
  fuzzyMatch: {
    use: boolean,
    removeCharacters: boolean,
    removeBrackets: boolean,
    replaceDiacritics: boolean
  },
  controllers: Controllers,
  onlineImageQueries: string,
  imageProviders: string[],
  imageProviderAPIs: ImageProviderAPI,
  executableArgs: string,
  imagePool: string,
  defaultImage: string,
  defaultTallImage: string,
  defaultHeroImage: string,
  defaultLogoImage: string,
  defaultIcon: string,
  localImages: string,
  localTallImages: string,
  localHeroImages: string,
  localLogoImages: string,
  localIcons: string,
  titleModifier: string,
  disabled: boolean
}
