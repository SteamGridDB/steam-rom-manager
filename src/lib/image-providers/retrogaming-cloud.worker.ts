import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
import * as Bluebird from 'bluebird';

class RetrogamingCloudProvider extends GenericProvider {
    private xrw: xRequestWrapper;

    constructor(protected proxy: ProviderProxy) {
        super(proxy);
        this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    }

    retrieveUrls() {
        this.retrieveImageList().then((listData) => {
            if (listData.length > 0) {
                this.xrw.setSpecialErrors({ 404: { retryCount: 1, silent: true } });
                let promises: Bluebird<void>[] = [];
                for (let i = 0; i < listData.length; i++) {
                    if (this.proxy.filter && listData[i].name && !this.proxy.fuzzyMatcher.fuzzyEqual(this.proxy.title, listData[i].name, { removeBrackets: true, removeCharacters: true, replaceDiacritics: true }))
                        continue;
                    else {
                        if (listData[i].id !== undefined)
                            promises.push(this.retrieveMediaData(listData[i].id));
                        if (listData[i].most_popular_media_url && (listData[i].most_popular_media_url as string).length > 0) {
                            this.proxy.image({
                                imageProvider: 'retrogaming.cloud',
                                imageUrl: listData[i].most_popular_media_url,
                                imageUploader: listData[i].most_popular_media_created_by_name || undefined,
                                loadStatus: 'notStarted'
                            });
                        }
                    }
                }
                return this.xrw.Bluebird.all(promises);
            }
        }).finally(() => {
            this.proxy.completed();
        });
    }

    stopUrlDownload() {
        this.xrw.cancel();
    }

    private retrieveImageList() {
        return this.xrw.addPromise(this.xrw.get('http://retrogaming.cloud/api/v1/game', { name: `%${this.proxy.title}%` }).then((response) => {
            return response != null ? (response.results || []) : [];
        }));
    }

    private retrieveMediaData(gameId: number) {
        return this.xrw.addPromise(this.xrw.get(`http://retrogaming.cloud/api/v1/game/${gameId}/media`).then((response) => {
            if (response !== null) {
                let results = response.results || [];

                for (let i = 0; i < results.length; i++) {
                    if (results[i].url) {
                        this.proxy.image({
                            imageProvider: 'retrogaming.cloud',
                            imageUrl: results[i].url,
                            imageUploader: results[i].created_by ? results[i].created_by.name : undefined,
                            loadStatus: 'notStarted'
                        });
                    }
                }
            }
        }).catch((error) => {
            this.xrw.logError(error);
        }).finally(() => {
            return this.xrw.Bluebird.resolve();
        }));
    }
}

new GenericProviderManager(RetrogamingCloudProvider, 'retrogaming.cloud');  