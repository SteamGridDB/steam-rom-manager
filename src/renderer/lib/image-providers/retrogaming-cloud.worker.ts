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
                    if (listData[i].id !== undefined)
                        promises.push(this.retrieveMediaData(listData[i].id));
                }
                this.xrw.Bluebird.all(promises).finally(() => this.proxy.completed());
            }
            else
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
                        if (this.proxy.filter && results[i].game && results[i].game.name && !this.proxy.fuzzyMatcher.fuzzyEqual(this.proxy.title, results[i].game.name, true, true))
                            continue;
                        else {
                            this.proxy.image({
                                imageProvider: this.proxy.providerName,
                                imageUrl: results[i].url,
                                imageUploader: results[i].created_by ? results[i].created_by.name : undefined,
                                loadStatus: 'notStarted'
                            });
                        }
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