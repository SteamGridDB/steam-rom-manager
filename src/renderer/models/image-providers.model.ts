import { ImageContent } from "./preview.model";
import { Http } from '@angular/http';

export enum ProviderEvent {
    success,
    error,
    timeout
}

export interface GenericImageProvider {
    getProvider(): string,
    retrieveUrls: (title: string, eventCallback: (event: ProviderEvent, data: any) => void, doneCallback: (title: string) => void) => void
}