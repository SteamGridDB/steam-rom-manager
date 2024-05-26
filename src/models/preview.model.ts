import { ImageProviderAPI } from "./user-configuration.model";
import { Controllers } from "./controllers.model";
import { ParserType, SteamInputEnabled } from "./parser.model";
import { multiLocalProviders, onlineProviders, providerCategories, singleLocalProviders } from "../lib/image-providers/available-providers";
import { artworkTypes, viewTypes } from "../lib/artwork-types";
import { SteamList } from "./helpers.model";

export type ImageDownloadStatus = 'notStarted' | 'downloading' | 'done' | 'failed';
export type ImageProviderName = 'Fallback Artwork' | 'Current Artwork' | 'Backup Artwork' | 'Local Artwork' | 'Manually Added' | 'Imported Artwork' | 'SteamGridDB' | 'Steam CDN'

export type ArtworkType = typeof artworkTypes[number];
export type ViewType = typeof viewTypes[number];
export type ArtworkViewType = ArtworkType | ViewType;

export function isArtworkType(artworkViewType: ArtworkViewType): artworkViewType is ArtworkType {
    return artworkTypes.includes(artworkViewType as ArtworkType)
}
export function initArtworkRecord<Y>(defaultValue: Y): Record<ArtworkType,Y> {
    return Object.assign({},...artworkTypes.map(x=>({[x]:defaultValue})))
}
export function initOnlineProviderRecord<Y>(defaultValue: Y): Record<OnlineProviderType,Y> {
    return Object.assign({},...onlineProviders.map(x=>({[x]:defaultValue})))

}

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
    searchQueries: string[],
    imageProviderAPIs: ImageProviderAPI[OnlineProviderType],
    content: ImageContent[]
}
export type ProviderCategoryType = typeof providerCategories[number];
export type OnlineProviderType = typeof onlineProviders[number];

export type OnlineImages = Record<ArtworkType, {
    [imagePool: string]: {
        retrieving: boolean,
        online: Record<OnlineProviderType,ImagesStatusAndContent>,
        offline: Record<MultiLocalProviderType,ImageContent[]>,
        parserEnabledProviders: OnlineProviderType[]
    }
}>
export type SingleLocalProviderType = typeof singleLocalProviders[number]
export type MultiLocalProviderType = typeof multiLocalProviders[number]//'local'|'manual'|'imported'
export type LocalProviderType = SingleLocalProviderType | MultiLocalProviderType;
export type ImageProviderType =  'default' | LocalProviderType | OnlineProviderType;

export interface PreviewDataAppImage {
    default: ImageContent,
    singleProviders: Record<SingleLocalProviderType, ImageContent>,
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
    filePath: string,
    title: string,
    extractedTitle: string,
    argumentString: string,
    drmProtect: boolean,
    images: Record<ArtworkType, PreviewDataAppImage>
}

export interface PreviewDataApps {
    [appID: string]: PreviewDataApp
}

export interface PreviewDataUser {
    username: string,
    excluded: {exceptionKey: string, filePath: string}[],
    apps: PreviewDataApps
}

export type PreviewData = SteamList<PreviewDataUser>

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

export type AppSelectionImages = Record<ArtworkType,AppSelectionImage>


export interface AppSelectionImage {
  pool: string,
  filename: string
}
