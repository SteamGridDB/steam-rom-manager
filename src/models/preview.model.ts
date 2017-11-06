import { Observable, BehaviorSubject } from "rxjs";

export type ImageDownloadStatus = 'notStarted' | 'downloading' | 'done' | 'failed';

export interface ImageContent {
    imageProvider: string,
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

export interface SteamTree {
    [steamDirectory: string]: {
        [userID: string]: any
    }
}

export interface SteamTreeData {
    tree: SteamTree,
    numberOfUsers: number
}

export interface SteamGridImageData {
    [steamDirectory: string]: {
        [userID: string]: {
            [appId: string]: string
        }
    }
}

export interface PreviewVariables {
    listIsBeingGenerated: boolean,
    listIsBeingSaved: boolean,
    listIsBeingRemoved: boolean,
    numberOfListItems: number,
    numberOfQueriedImages: number
}