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
		        let exactMatch: boolean = false;
                for (let i = 0; i < listData.length; i++) {
                    if (listData[i].id !== undefined && listData[i].name !== undefined && listData[i].name === this.proxy.title && listData[i].most_popular_media_url !== '') {
                        promises.push(this.retrieveMediaData(listData[i].id));
                        exactMatch = true;
                    }
			    }

                if (!exactMatch){
                    for (let i = 0; i < listData.length; i++) {
                        if (this.proxy.filter && !this.proxy.fuzzyMatcher.fuzzyEqual(this.proxy.title, listData[i].name, true, true))
                            continue;
                        if (listData[i].id !== undefined && listData[i].name !== undefined && listData[i].most_popular_media_url !== '')
                            this.proxy.image({
                                imageProvider: this.proxy.providerName,
                                imageUrl: listData[i].most_popular_media_url,
                                imageUploader: listData[i].most_popular_media_created_by_name || undefined,
                                loadStatus: 'notStarted'});
                    }
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
                        this.proxy.image({
                            imageProvider: this.proxy.providerName,
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