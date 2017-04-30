import { GenericImageProvider, ImageProviderData } from '../models';
import * as GenericProviders from './image-providers';
import { Http } from '@angular/http';
import { Subject } from "rxjs";

export class ImageProvider {
    private availableProviders: { [key: string]: GenericImageProvider };
    private stopImageUrlsDownload: Subject<any>;

    constructor(private http: Http) {
        this.availableProviders = {};
        this.stopImageUrlsDownload = new Subject();

        for (let key in GenericProviders) {
            let parser = new (GenericProviders[key].prototype.constructor)(this.http, this.stopImageUrlsDownload.asObservable());
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

    retrieveUrlsFromProvider(title: string, provider: string) {
        return new Promise<ImageProviderData>((resolve, reject) => {
            if (this.availableProviders[provider])
                return resolve(this.availableProviders[provider].retrieveUrls(title));
            else
                return reject(`"${provider}" not available`);
        });
    }

    retrieveUrls(title: string, ...providers: string[]) {
        let promises: Promise<ImageProviderData>[] = [];

        if (providers.length === 0)
            providers = this.getAvailableProviders();

        for (let i = 0; i < providers.length; i++) {
            promises.push(this.retrieveUrlsFromProvider(title, providers[i]));
        }
        return Promise.all(promises).then((data) => {
            let mergedData: ImageProviderData = { images: [], failed: [] };
            for (let i = 0; i < data.length; i++) {
                if (data[i].failed || data[i].images){
                    mergedData.images = mergedData.images.concat(data[i].images);
                    mergedData.failed = mergedData.failed.concat(data[i].failed);
                }
            }
            return mergedData;
        });
    }

    stopUrlDownload(){
        this.stopImageUrlsDownload.next();
    }
}