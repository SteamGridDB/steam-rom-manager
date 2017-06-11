import { GenericImageProvider, ImageContent, ProviderEvent } from "../../models";
import { LoggerService, SettingsService } from "../../services";
import { Http, Headers, URLSearchParams } from '@angular/http';
import { Observable } from "rxjs";

export class SteamGridDbProvider implements GenericImageProvider {
    constructor(private http: Http, private loggerService: LoggerService, private settingsService: SettingsService, private downloadInterrupt: Observable<any>, private timeout: number = 40000, private retryCount: number = 3) { }

    getProvider() {
        return 'SteamGridDB';
    }

    retrieveUrls(title: string, eventCallback: (event: ProviderEvent, data: any) => void, doneCallback: (title: string) => void) {
        let params = new URLSearchParams();
        params.append('game', title);
        params.append('fields', ['author', 'grid_url'].toString());

        return new Promise<number>((resolve, reject) => {
            let next: number = undefined;
            let downloadStop = this.downloadInterrupt.subscribe(() => { next = undefined; downloadStop.unsubscribe(); });
            let subscription = this.http.get('http://www.steamgriddb.com/api/grids', { params: params }).timeout(this.timeout).retry(this.retryCount).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        if (parsedBody['data'] !== undefined) {
                            for (let i = 0; i < parsedBody['data'].length; i++) {
                                eventCallback(ProviderEvent.success, {
                                    imageProvider: this.getProvider(),
                                    imageUrl: parsedBody['data'][i].grid_url,
                                    imageUploader: parsedBody['data'][i].author,
                                    loadStatus: 'notStarted'
                                });
                            }
                        }
                    } catch (error) {
                        eventCallback(ProviderEvent.error, `${error} (${title})`);
                    } finally {
                        if (!downloadStop.closed)
                            downloadStop.unsubscribe();
                    }
                },
                (error) => {
                    eventCallback(ProviderEvent.error, `${error} (${title})`);

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            )
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve(next);
            });
        }).then(() => {
            doneCallback(title);
        });
    }
}