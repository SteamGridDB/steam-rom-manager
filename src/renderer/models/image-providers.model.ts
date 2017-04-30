import { ImageContent } from "./preview.model";
import { Http } from '@angular/http';

export interface ImageProviderData{
    images: ImageContent[],
    failed: string[]
}

export interface GenericImageProvider {
    getProvider(): string,
    retrieveUrls: (title: string) => Promise<ImageProviderData>
}

export interface SteamGridDBData {
    grid_id: string,
    game_name: string,
    username: string,
    steam64: string,
    avatar: string,
    grid_style: string,
    score: string,
    appid: string,
    voted: string,
    delete: boolean,
    grid_link: string,
    thumbnail_link: string
}