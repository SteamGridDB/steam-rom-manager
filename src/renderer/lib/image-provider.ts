import { ProviderPostEventMap, ProviderCallback, ProviderReceiveEventMap, ProviderReceiveObject } from '../models';
import { FuzzyService, LoggerService, SettingsService } from "../services";
import { imageProviders, availableProviders } from './image-providers';
import { gApp } from "../app.global";
import * as _ from 'lodash';


export class ImageProvider { //Bind filtering and list
    private availableProviders: { [key: string]: Worker } = {};
    private callbackMap = new Map<string, ProviderCallback>();
    private filterIsEnabled: boolean = false;

    constructor(private fuzzyService: FuzzyService, private loggerService: LoggerService) {
        for (let key in imageProviders) {
            this.availableProviders[key] = (new (imageProviders[key])() as Worker);
            this.availableProviders[key].addEventListener('message', this.messageEvent.bind(this));
            this.availableProviders[key].addEventListener('error', this.errorEvent.bind(this));
        }
    }

    private get lang() {
        return gApp.lang.imageProvider;
    }

    toggleFilter(enable: boolean) {
        if (this.filterIsEnabled !== enable) {
            for (let key in this.availableProviders) {
                this.postMessage(this.availableProviders[key], 'toggleFiltering', { enable: enable });
            }
        }
    }

    setFuzzyList(listAndCache: { totalGames: number, games: string[], cache: { [key: string]: any } }) {
        for (let key in this.availableProviders) {
            this.postMessage(this.availableProviders[key], 'fuzzyList', { listAndCache });
        }
    }

    getAvailableProviders() {
        return availableProviders();
    }

    retrieveUrls(title: string, providers: string[], eventCallback: ProviderCallback) {
        for (let i = 0; i < providers.length; i++) {
            if (this.availableProviders[providers[i]]) {
                let id = _.uniqueId();
                this.callbackMap.set(id, eventCallback);
                this.postMessage(this.availableProviders[providers[i]], 'retrieveUrls', { id: id, title: title });
            }
            else
                eventCallback('completed', { title: title });
        }
    }

    stopUrlDownload() {
        for (let key in this.availableProviders) {
            this.postMessage(this.availableProviders[key], 'stopDownloads', null);
        }
    }

    private postMessage<K extends keyof ProviderReceiveEventMap>(worker: Worker, event: K, data: ProviderReceiveEventMap[K]) {
        worker.postMessage(<ProviderReceiveObject<K>>{ event: event, data: data });
    }

    private messageEvent(event: MessageEvent) {
        if (event.data && event.data.event) {
            switch ((event.data.event as keyof ProviderPostEventMap)) {
                case 'error':
                    {
                        let data = (event.data.data as ProviderPostEventMap['error']);
                        if (this.callbackMap.has(data.id)) {
                            this.callbackMap.get(data.id)('error', { provider: data.provider, title: data.title, error: data.error, url: data.url });
                        }
                    }
                    break;
                case 'timeout':
                    {
                        let data = (event.data.data as ProviderPostEventMap['timeout']);
                        if (this.callbackMap.has(data.id)) {
                            this.callbackMap.get(data.id)('timeout', { provider: data.provider, time: data.time });
                        }
                    }
                    break;
                case 'image':
                    {
                        let data = (event.data.data as ProviderPostEventMap['image']);
                        if (this.callbackMap.has(data.id)) {
                            this.callbackMap.get(data.id)('image', { content: data.content });
                        }
                    }
                    break;
                case 'completed':
                    {
                        let data = (event.data.data as ProviderPostEventMap['completed']);
                        if (this.callbackMap.has(data.id)) {
                            this.callbackMap.get(data.id)('completed', { title: data.title });
                            this.callbackMap.delete(data.id);
                        }
                    }
                    break;
                case 'fuzzyEvent':
                    {
                        let data = (event.data.data as ProviderPostEventMap['fuzzyEvent']);
                        this.fuzzyService.eventCallback(data.event, data.data);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    private errorEvent(event: ErrorEvent) {
        if (event && event.error) {
            this.loggerService.error(this.lang.error.webWorkerError__i.interpolate({
                error: event.error
            }));
        }
        else {
            this.loggerService.error(this.lang.error.unknownWebWorkerError.interpolate({
                data: JSON.stringify(event, null, 4)
            }));
        }
    }
}