import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";

class ConsoleGridProvider extends GenericProvider {
    private xrw: xRequestWrapper;

    constructor(protected proxy: ProviderProxy) {
        super(proxy);
        this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    }

    retrieveUrls() {
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

        this.xrw.promise = this.xrw.Bluebird.resolve(platforms).each((platform: string) => {
            return this.xrw.get('http://consolegrid.com/api/top_picture', {
                console: platform,
                game: this.proxy.title
            }, '').then((response) => {
                 if (response && response.length > 0 && response.length < 64) {
                    this.proxy.image({
                        imageProvider: 'ConsoleGrid',
                        imageUrl: response,
                        loadStatus: 'notStarted'
                    });
                } 
            }).catch((error) => {
                this.xrw.logError(error);
            }).finally(() => {
                this.xrw.Bluebird.resolve();
            });
        }).finally(() => {
            this.proxy.completed();
        });
    }

    stopUrlDownload() {
        this.xrw.cancel();
    }
}

new GenericProviderManager(ConsoleGridProvider, 'ConsoleGrid'); 