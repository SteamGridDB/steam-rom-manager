import { GenericImageProvider, ImageContent, ImageProviderData } from "../../models";
import { Http, Headers, URLSearchParams } from '@angular/http';
import { Observable } from "rxjs";

export class ConsoleGridProvider implements GenericImageProvider {
    constructor(private http: Http, private downloadInterrupt: Observable<any>, private timeout: number = 40000, private retryCount = 3) { }

    getProvider() {
        return 'ConsoleGrid';
    }

    retrieveUrls(title: string) {
        let platforms: string[] = [
            'NES',
            'SNES',
            'N64',
            'GameCube',
            'PS1',
            'PS2',
            'Genesis',
            'Gameboy',
            'GBA',
            'Wii',
            'DS',
            'PSP',
            'Dreamcast',
            'SMS',
            'TG16',
            'SGG',
            'Saturn',
            'Arcade'
        ];
        let promises: Promise<{ url: string, failed: string }>[] = [];

        for (let i = 0; i < platforms.length; i++) {
            promises.push(this.retrieveUrl(title, platforms[i]));
        }

        return Promise.all(promises).then((data) => {
            let imageData: ImageProviderData = { images: [], failed: [] };

            for (let i = 0; i < data.length; i++) {
                if (data[i].failed)
                    imageData.failed.push(data[i].failed);
                else if (data[i].url)
                    imageData.images.push({ imageProvider: this.getProvider(), imageUrl: data[i].url, loadStatus: 'none' });
            }

            return imageData;
        });
    }

    private retrieveUrl(title: string, platform: string) {
        let params = new URLSearchParams();
        params.append('console', platform);
        params.append('game', title);

        return new Promise<{ url: string, failed: string }>((resolve, reject) => {
            let data: { url: string, failed: string } = { url: undefined, failed: undefined };
            let downloadStop = this.downloadInterrupt.subscribe(() => downloadStop.unsubscribe());
            let subscription = this.http.get('http://consolegrid.com/api/top_picture', { params: params }).timeout(this.timeout).retry(this.retryCount).subscribe(
                (response) => {
                    data.url = response.text();
                    data.failed = undefined;

                    if (!downloadStop.closed)
                        downloadStop.unsubscribe();
                },
                (error) => {
                    data.failed = `${error} (http://consolegrid.com/api/top_picture?${params.toString()})`;

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