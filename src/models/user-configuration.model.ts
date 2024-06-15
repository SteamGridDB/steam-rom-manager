import { OnlineProviderType, ArtworkType } from '.';
import { Controllers } from './controllers.model';
import { ParserType, SteamInputEnabled } from './parser.model';

export type ImageProviderAPI = Record<OnlineProviderType, {
    [apiInputName: string]: string | string[] | boolean
}>

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
  },
  fuzzyMatch: {
    use: boolean,
    removeCharacters: boolean,
    removeBrackets: boolean,
    replaceDiacritics: boolean
  },
  controllers: Controllers,
  steamInputEnabled: SteamInputEnabled,
  onlineImageQueries: string,
  imageProviders: OnlineProviderType[],
  imageProviderAPIs: ImageProviderAPI,
  executableArgs: string,
  imagePool: string,
  drmProtect: boolean,
  defaultImage: Record<ArtworkType,string>
  localImages: Record<ArtworkType,string>
  titleModifier: string,
  disabled: boolean
}
