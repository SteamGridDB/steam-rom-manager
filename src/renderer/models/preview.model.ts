import { Observable, BehaviorSubject } from "rxjs";
import { Reference } from "../lib";

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

export interface Images {
    [extractedTitle: string]: ImagesStatusAndContent
};

export interface PreviewDataApp {
    steamCategories: string[],
    imageProviders: string[],
    executableLocation: string,
    title: string,
    argumentString: string,
    steamImage: ImageContent,
    currentImageIndex: number,
    currentIconIndex: number,
    icons: string[],
    images: Reference<ImagesStatusAndContent>
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