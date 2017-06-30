import { GenericImageProvider, ImageContent, ProviderEvent, AppSettings } from "../../models";
import { LoggerService, SettingsService } from "../../services";
import { Http, Headers, URLSearchParams, Response, QueryEncoder } from '@angular/http';
import { Observable } from "rxjs";
import { queue } from 'async';
import { FuzzyMatcher } from "../fuzzy-matcher";

class CustomUrlEncoder extends QueryEncoder {
    encodeKey(key: string): string {
        return encodeURIComponent(key);
    }

    encodeValue(value: string): string {
        return encodeURIComponent(value);
    }
}

export class RetroGamingCloudProvider implements GenericImageProvider {
    private timeoutQueue: AsyncQueue<{ timeout: number, eventCallback: () => void }>;
    private timeoutTimer: any;
    private fuzzyMatcher: FuzzyMatcher;
    private appSettings: AppSettings;

    constructor(private http: Http, private loggerService: LoggerService, private settingsService: SettingsService, private downloadInterrupt: Observable<any>, private timeout: number = 40000, private retryCount: number = 3) {
        this.timeoutQueue = queue((task: { timeout: number, eventCallback: () => void }, onComplete) => {
            if (this.timeoutTimer === undefined) {
                this.timeoutTimer = setTimeout(() => {
                    this.timeoutTimer = undefined;
                }, task.timeout * 1000);
                task.eventCallback();
            }
            onComplete();
        });
        this.fuzzyMatcher = new FuzzyMatcher(http, loggerService, settingsService);
        this.settingsService.onLoad((appSettings: AppSettings) => {
            this.appSettings = appSettings;
        });
    }

    getProvider() {
        return 'retrogaming.cloud';
    }

    retrieveUrls(title: string, eventCallback: (event: ProviderEvent, data: any) => void, doneCallback: (title: string) => void) {
        Promise.resolve().then(() => {
            if (!this.fuzzyMatcher.isPrepared() || !this.fuzzyMatcher.isReady())
                this.fuzzyMatcher.prepare();
        }).then(() => {
            return this.retrieveImageList(title, eventCallback);
        }).then((listData) => {
            if (listData.length > 0) {
                let promises: Promise<void>[] = [];
                for (let i = 0; i < listData.length; i++) {
                    if (listData[i].id !== undefined)
                        promises.push(this.retrieveMediaData(title, listData[i].id, eventCallback));
                }
                return Promise.all(promises);
            }
        }).catch((error) => {
            eventCallback(ProviderEvent.error, `${error} (${title})`);
        }).then(() => {
            if (this.timeoutTimer !== undefined) {
                clearTimeout(this.timeoutTimer);
                this.timeoutTimer = undefined;
            }
            doneCallback(title);
        });
    }

    private handleRetryErrors(errors: Observable<Response>, eventCallback: (event: ProviderEvent, data: any) => void) {
        return errors.mergeMap((response: Response) => {
            if (response.status === 429) {
                let timeoutInSeconds = parseInt(response.headers.get('Retry-After')) || 1;
                this.timeoutQueue.push({ timeout: timeoutInSeconds, eventCallback: () => eventCallback(ProviderEvent.timeout, `"${this.getProvider()}" requested a timeout of ${timeoutInSeconds} seconds.`) });
                return Observable.of(response).delay(timeoutInSeconds * 1000);
            }
            return Observable.throw(response).take(this.retryCount);
        });
    }

    private retrieveMediaData(title: string, gameId: number, eventCallback: (event: ProviderEvent, data: any) => void) {
        return new Promise<void>((resolve, reject) => {
            let downloadStop = this.downloadInterrupt.subscribe(() => downloadStop.unsubscribe());
            let subscription = this.http.get(`http://retrogaming.cloud/api/v1/game/${gameId}/media`).timeout(this.timeout).retryWhen((errors) => this.handleRetryErrors(errors, eventCallback)).subscribe(
                (response) => {
                    let returndeData = response.json();
                    let results = returndeData.results || [];

                    for (let i = 0; i < results.length; i++) {
                        if (results[i].url) {
                            if (this.appSettings.fuzzyMatcher.filterProviders && results[i].game && results[i].game.name && !this.fuzzyMatcher.fuzzyEqual(title, results[i].game.name, true, true))
                                continue;

                            eventCallback(ProviderEvent.success, {
                                imageProvider: this.getProvider(),
                                imageUploader: results[i].created_by ? results[i].created_by.name : undefined,
                                imageUrl: results[i].url,
                                loadStatus: 'notStarted'
                            });
                        }
                    }

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                },
                (error) => {
                    if (error.status !== 404)
                        eventCallback(ProviderEvent.error, `${error} (${title})`);

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            );
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve();
            });
        });
    }

    private retrieveImageList(title: string, eventCallback: (event: ProviderEvent, data: any) => void) {
        let params = new URLSearchParams('', new CustomUrlEncoder());
        params.append('name', title);

        return new Promise<any[]>((resolve, reject) => {
            let list: any[] = [];
            let downloadStop = this.downloadInterrupt.subscribe(() => downloadStop.unsubscribe());
            let subscription = this.http.get('http://retrogaming.cloud/api/v1/game', { params: params }).timeout(this.timeout).retryWhen((errors) => this.handleRetryErrors(errors, eventCallback)).subscribe(
                (response) => {
                    let returndeData = response.json();
                    list = returndeData.results || [];

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                },
                (error) => {
                    eventCallback(ProviderEvent.error, `${error} (${title})`);

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            );
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve(list);
            });
        });
    }
}