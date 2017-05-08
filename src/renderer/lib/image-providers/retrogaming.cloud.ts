import { GenericImageProvider, ImageContent, ImageProviderData } from "../../models";
import { Http, Headers, URLSearchParams } from '@angular/http';
import { Observable } from "rxjs";

export class RetroGamingCloudProvider implements GenericImageProvider {
    constructor(private http: Http, private downloadInterrupt: Observable<any>, private timeout: number = 40000, private retryCount: number = 3) { }

    getProvider() {
        return 'retrogaming.cloud';
    }

    retrieveUrls(title: string) {
        let data: ImageProviderData = { images: [], failed: [] };

        return this.retrieveImageList(title).then((listData) => {
            if (listData.failed) {
                data.failed.push(listData.failed);
                listData.list = [];
            }
            return listData;
        }).then((listData) => {
            if (listData.list.length > 0) {
                let promises: Promise<{ images: ImageContent[], failed: string[] }>[] = [];
                for (let i = 0; i < listData.list.length; i++) {
                    if (listData.list[i].id !== undefined)
                        promises.push(this.retrieveMediaData(listData.list[i].id));
                }
                return Promise.all(promises).then((results) => {
                    for (let i = 0; i < results.length; i++) {
                        data.images = data.images.concat(results[i].images);
                        data.failed = data.failed.concat(results[i].failed);
                    }
                });
            }
        }).then(() => {
            return data;
        });
    }

    private retrieveMediaData(gameId: number) {
        return new Promise<{ images: ImageContent[], failed: string[] }>((resolve, reject) => {
            let retryCounter = 0;
            let data: { images: ImageContent[], failed: string[] } = { images: [], failed: [] };
            let downloadStop = this.downloadInterrupt.subscribe(() => downloadStop.unsubscribe());
            let subscription = this.http.get(`http://retrogaming.cloud/api/v1/game/${gameId}/media`).timeout(this.timeout).retry(this.retryCount).subscribe(
                (response) => {
                    let returndeData = response.json();
                    let results = returndeData.results || [];

                    for (let i = 0; i < results.length; i++) {
                        if (results[i].url)
                            data.images.push({imageProvider: this.getProvider(), imageUploader: results[i].created_by ? results[i].created_by.name : undefined, imageUrl: results[i].url, loadStatus: 'none'});
                    }

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                },
                (error) => {
                    if (retryCounter++ === this.retryCount)
                        data.failed.push(`${error} (http://retrogaming.cloud/api/v1/game/${gameId}/media)`);

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            )
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve(data);
            });
        });
    }

    private retrieveImageList(title: string) {
        let params = new URLSearchParams();
        params.append('name', title);

        return new Promise<{ list: any[], failed: string }>((resolve, reject) => {
            let retryCounter = 0;
            let data: { list: any[], failed: string } = { list: undefined, failed: undefined };
            let downloadStop = this.downloadInterrupt.subscribe(() => downloadStop.unsubscribe());
            let subscription = this.http.get('http://retrogaming.cloud/api/v1/game', { params: params }).timeout(this.timeout).retry(this.retryCount).subscribe(
                (response) => {
                    let returndeData = response.json();
                    data.list = returndeData.results || [];

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                },
                (error) => {
                    if (retryCounter++ === this.retryCount)
                        data.failed = `${error} (http://retrogaming.cloud/api/v1/game?${params.toString()})`;

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            )
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve(data);
            });
        });
    }
}