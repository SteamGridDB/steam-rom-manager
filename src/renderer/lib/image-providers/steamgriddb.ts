import { GenericImageProvider, ImageContent, ImageProviderData, SteamGridDBData } from "../../models";
import { Http, Headers, URLSearchParams } from '@angular/http';
import { Observable } from "rxjs";

export class SteamGridDbProvider implements GenericImageProvider {
    constructor(private http: Http, private downloadInterrupt: Observable<any>, private timeout: number = 120000) { }

    getProvider() {
        return 'SteamGridDB';
    }

    retrieveUrls(title: string) {
        let data: ImageProviderData = { images: [], failed: [] };

        let promiseLoop = (nextPage: number): Promise<ImageProviderData> => {
            return this.retrieveUrlsPerPage(data, title, nextPage).then((nextPage) => {
                if (nextPage !== undefined)
                    return promiseLoop(nextPage);
            });
        };

        return promiseLoop(0).then(() => {
            return data;
        });
    }

    private retrieveUrlsPerPage(data: ImageProviderData, title: string, nextPage: number) {
        let params = new URLSearchParams();
        params.append('name', title);
        params.append('page', nextPage.toString());

        return new Promise<number>((resolve, reject) => {
            let next: number = undefined;
            let downloadStop = this.downloadInterrupt.subscribe(() => { next = undefined; downloadStop.unsubscribe(); });
            let subscription = this.http.get('http://www.steamgriddb.com/search.php', { params: params }).timeout(this.timeout).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        if (parsedBody[0] !== undefined && parsedBody[0] !== 'None') {
                            for (let i = 3; i < parsedBody.length; i++) {
                                data.images.push({
                                    imageProvider: this.getProvider(),
                                    imageUrl: (<SteamGridDBData>parsedBody[i]).grid_link,
                                    imageUploader: (<SteamGridDBData>parsedBody[i]).username,
                                    loadStatus: 'none'
                                });
                            }

                            //20 per page, here page is parsedBody[0] and total image count is parsedBody[1]
                            if ((parsedBody[0] + 1) * 20 < parsedBody[1]) {
                                next = parsedBody[0] + 1;
                            }
                        }
                    } catch (error) {
                        data.failed.push(`${error} (http://www.steamgriddb.com/search.php?${params.toString()})`);
                    } finally {
                        if (!downloadStop.closed)
                            downloadStop.unsubscribe();
                    }
                },
                (error) => {
                    data.failed.push(`${error} (http://www.steamgriddb.com/search.php?${params.toString()})`);

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                }
            )
            downloadStop.add(() => {
                if (!subscription.closed)
                    subscription.unsubscribe();
                resolve(next);
            });
        });
    }
}