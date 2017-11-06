import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";

class SteamGridDbProvider extends GenericProvider {
    private xrw: xRequestWrapper;

    constructor(protected proxy: ProviderProxy) {
        super(proxy);
        this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    }

    retrieveUrls() {
        this.xrw.promise = this.xrw.get('http://www.steamgriddb.com/api/grids', {
            game: this.proxy.title,
            fields: ['author', 'grid_url'].toString()
        }).then((response) => {
            if (response !== null && response['data'] !== undefined) {
                for (let i = 0; i < response['data'].length; i++) {
                    this.proxy.image({
                        imageProvider: this.proxy.providerName,
                        imageUrl: response['data'][i].grid_url,
                        imageUploader: response['data'][i].author,
                        loadStatus: 'notStarted'
                    });
                }
            }
        }).catch((error) => {
            this.xrw.logError(error);
        }).finally(() => {
            this.proxy.completed();
        });
    }

    stopUrlDownload() {
        this.xrw.cancel();
    }
}

new GenericProviderManager(SteamGridDbProvider, 'SteamGridDB'); 