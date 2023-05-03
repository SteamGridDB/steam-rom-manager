import { Observable, BehaviorSubject } from "rxjs";
import { ImageProviderAPI } from "./user-configuration.model";
import { Controllers } from "./controllers.model";
import { ParserType } from "./parser.model";

export type ImageDownloadStatus = 'notStarted' | 'downloading' | 'done' | 'failed';

export interface ImageContent {
    imageProvider: 'SteamGridDB' | 'GoogleImages' | 'Steam' | 'LocalStorage',
    imageUploader?: string,
    imageRes?: string,
    imageUrl: string,
    loadStatus: ImageDownloadStatus
};

export interface ImagesStatusAndContent {
    retrieving: boolean,
    defaultImageProviders: string[],
    searchQueries: string[],
    imageProviderAPIs: ImageProviderAPI,
    content: ImageContent[]
}

export interface AppImages {
    [extractedTitle: string]: ImagesStatusAndContent
};

export interface PreviewDataAppImage {
    steam: ImageContent,    // 0? index
    default: ImageContent,  // 0-1? index
    imagePool: string,      // 0-2+ index
    imageIndex: number
}


export interface PreviewDataApp {
    entryId: number,
    changedId?: string,
    status: 'add' | 'skip' | 'remove',
    configurationTitle: string,
    parserId: string,
    parserType: ParserType,
    steamCategories: string[],
    controllers: Controllers,
    imageProviders: string[],
    startInDirectory: string,
    executableLocation: string,
    title: string,
    extractedTitle: string,
    argumentString: string,
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
