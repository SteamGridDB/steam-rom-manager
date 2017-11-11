import { Observable, BehaviorSubject } from "rxjs";

export type ImageDownloadStatus = 'notStarted' | 'downloading' | 'done' | 'failed';

export interface ImageContent {
    imageProvider: 'SteamGridDB' | 'retrogaming.cloud' | 'ConsoleGrid' | 'Steam' | 'LocalStorage',
    imageUploader?: string,
    imageUrl: string,
    loadStatus: ImageDownloadStatus
};

export interface ImagesStatusAndContent {
    retrieving: boolean,
    defaultImageProviders: string[],
    searchQueries: string[],
    content: ImageContent[]
}

export interface AppImages {
    [extractedTitle: string]: ImagesStatusAndContent
};

export interface PreviewDataApp {
    entryId: number,
    status: 'add' | 'skip' | 'remove',
    configurationTitle: string,
    steamCategories: string[],
    imageProviders: string[],
    startInDirectory: string,
    executableLocation: string,
    title: string,
    argumentString: string,
    steamImage: ImageContent,
    currentImageIndex: number,
    currentIconIndex: number,
    icons: string[],
    imagePool: string
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
    numberOfListItems: number,
    numberOfQueriedImages: number
}