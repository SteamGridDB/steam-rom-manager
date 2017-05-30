import { Observable, BehaviorSubject } from "rxjs";
import { Reference } from "../lib";

export type LoadStatus = 'none' | 'downloading' | 'downloaded' | 'failed';
export type Urltatus = 'none' | 'retrieving' | 'retrievedAll' | 'retrievedSome';

export interface ImageContent {
    imageProvider: string,
    imageUploader?: string,
    imageUrl: string,
    loadStatus: LoadStatus
};

export interface ImagesStatusAndContent {
    status: Urltatus,
    searchTitles: string[],
    content: ImageContent[]
}

export interface Images {
    [extractedTitle: string]: ImagesStatusAndContent
};

export interface PreferedImages {
    [title: string]: string
};

export interface PreviewData {
    [appID: string]: {
        steamDirectories: {
            [key: string]: {
                steamCategories: string[],
                executableLocation: string,
                argumentString: string,
            }
        },
        title: string,
        currentImageIndex: number,
        imageKey: string,
        images: Reference<ImagesStatusAndContent>
    }
}

/*export interface PreviewData2 {
    [steamDirectory: string]: {
        [userID: string]: {
            username: string,
            apps: {
                [id: string]: {
                    steamCategories: string[],
                    executableLocation: string,
                    title: string,
                    argumentString: string,
                    currentImageIndex: number,
                    images: Reference<ImagesStatusAndContent>
                }
            }
        }
    }
}*/

export interface PreviewStateVariables {
    numberOfUrlsBeingDownloaded: number,
    listIsUpdating: boolean,
    listIsBeingSaved: boolean,
    skipDownloading: boolean,
    listIsBeingRemoved: boolean,
    greedySearch: boolean,
    numberOfListItems: number,
    numberOfEditedSteamDirectories: number
}