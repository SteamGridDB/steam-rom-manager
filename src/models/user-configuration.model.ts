import { Controllers } from './controllers.model';
import { StringMap, ParserType } from './parser.model';

export interface ImageProviderAPI {
  [imageProvider: string]: {
    [apiInputName: string]: string | string[] | boolean
  }
}

export interface UserAccountsInfo {
  specifiedAccounts: string,
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
  defaultImage: {
    [artworkType: string]: string
  },
  localImages: {
    [artworkType: string]: string
  },
  titleModifier: string,
  disabled: boolean
}
