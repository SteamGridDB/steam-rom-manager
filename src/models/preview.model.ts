import { Observable, BehaviorSubject } from "rxjs";
import { ImageProviderAPI } from "./user-configuration.model";
import { Controllers } from "./controllers.model";
import { ParserType, SteamInputEnabled } from "./parser.model";

export type ImageDownloadStatus = 'notStarted' | 'downloading' | 'done' | 'failed';
export type ImageProviderName = 'Fallback Artwork' | 'Current Artwork' | 'Backup Artwork' | 'Local Artwork' | 'Manually Added' | 'Imported Artwork' | 'SteamGridDB' | 'Steam CDN'

export interface ImageContent {
    imageProvider: ImageProviderName,
    imageUploader?: string,
    imageRes?: string,
    imageUrl: string,
    loadStatus: ImageDownloadStatus,
    steamId?: string // used by steamCDN provider,
    imageArtworkId?: string // used by sgdb provider,
    imageGameId?: string // used by steamCDN and sgdb providers (sgdb's game id)
};

export interface ImagesStatusAndContent {
    retrieving: boolean,
    searchQueries: string[],
    imageProviderAPIs: ImageProviderAPI[OnlineProviderType],
    content: ImageContent[]
}
export type OnlineProviderType = 'steamCDN' | 'sgdb';

export interface OnlineImages {
    [artworkType: string]: {
        [imagePool: string]: {
            online: Record<OnlineProviderType,ImagesStatusAndContent>,
            offline: Record<MultiLocalProviderType,ImageContent[]>,
            parserEnabledProviders: OnlineProviderType[]
        }
    }
};
export type SingleLocalProviderType = 'steam'|'artworkBackup'
export type MultiLocalProviderType = 'local'|'manual'|'imported'
export type LocalProviderType = SingleLocalProviderType | MultiLocalProviderType;
export type ImageProviderType =  'default'|LocalProviderType | OnlineProviderType;

export interface PreviewDataAppImage {
    default: ImageContent,
    singleProviders: Record<SingleLocalProviderType,ImageContent>,
    imagePool: string, // joins with AppImages
    imageIndex: number // integrated with appImages helper
}


export interface PreviewDataApp {
    entryId: number,
    changedId?: string,
    sgdbId?: string,
    status: 'add' | 'skip' | 'remove',
    configurationTitle: string,
    parserId: string,
    parserType: ParserType,
    steamCategories: string[],
    steamInputEnabled: SteamInputEnabled,
    controllers: Controllers,
    onlineProviders: OnlineProviderType[],
    startInDirectory: string,
    executableLocation: string,
    title: string,
    extractedTitle: string,
    argumentString: string,
    drmProtect: boolean,
    images: {
      [artworkType: string]: PreviewDataAppImage
    }
}

export interface PreviewDataApps {
    [appID: string]: PreviewDataApp
}

export interface PreviewDataUser {
    username: string,
    apps: PreviewDataApps
}

export interface PreviewData {
    [steamDirectory: string]: {
        [userID: string]: PreviewDataUser
    }
}

export interface PreviewVariables {
    listIsBeingGenerated: boolean,
    listIsBeingSaved: boolean,
    listIsBeingRemoved: boolean,
    listHasGenerated: boolean,
    numberOfListItems: number,
    numberOfQueriedImages: number

}

export interface AppSelection {
  title: string,
  images: AppSelectionImages
}

export interface AppSelectionImages {
  [artworkType: string]: AppSelectionImage
}

export interface AppSelectionImage {
  pool: string,
  filename: string
}
