import { GenericImageProvider, ProviderEvent } from '../models';
import { LoggerService, SettingsService } from "../services";
import { Http } from '@angular/http';
import { Subject } from "rxjs";
import * as GenericProviders from './image-providers';

export class ImageProvider {
    private availableProviders: { [key: string]: GenericImageProvider };
    private stopImageUrlsDownload: Subject<any>;

    constructor(private http: Http, private loggerService: LoggerService, private settingsService: SettingsService) {
        this.availableProviders = {};
        this.stopImageUrlsDownload = new Subject();

        for (let key in GenericProviders) {
            let parser = new (GenericProviders[key].prototype.constructor)(this.http, this.loggerService, this.settingsService, this.stopImageUrlsDownload.asObservable());
            this.availableProviders[parser.getProvider()] = parser;
        }
    }

    getAvailableProviders() {
        let parsers: string[] = [];
        for (let key in this.availableProviders) {
            parsers.push(key);
        }
        return parsers;
    }

    retrieveUrls(title: string, providers: string[], eventCallback: (event: ProviderEvent, data: any) => void, doneCallback: (title: string) => void) {
        if (providers !== undefined) {
            for (let i = 0; i < providers.length; i++) {
                this.availableProviders[providers[i]].retrieveUrls(title, eventCallback, doneCallback);
            }
        }
    }

    stopUrlDownload() {
        this.stopImageUrlsDownload.next();
    }
}