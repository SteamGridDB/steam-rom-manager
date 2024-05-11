import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import {apiKey, idRegex} from "./steamgriddb.worker";
import { xRequestWrapper } from "./x-request-wrapper";
import SGDB from "steamgriddb";
import { artworkTypes, steamArtworkDict } from '../artwork-types'
import { imageProviderNames } from "./available-providers";
export class SteamCDNProvider extends GenericProvider {
  private xrw: xRequestWrapper<SteamCDNProvider>;
  private client: any;

  constructor(protected proxy: ProviderProxy<SteamCDNProvider>) {
    super(proxy);
    this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    this.client = new SGDB({key: apiKey});
  }

  retrieveUrls() {
    let self = this;
    this.xrw.promise = new Promise<void>((resolve) => {
      let idPromise: Promise<number> = null;
      if(idRegex.test(self.proxy.title)) {
        idPromise = Promise.resolve(parseInt(self.proxy.title.match(idRegex)[1]))
      } else {
        idPromise = self.client.searchGame(self.proxy.title).then((res: any) => (res[0]||{}).id);
      }
      idPromise.then((chosenId: number|undefined)=> {
        if(!chosenId) {
          if(self.proxy.imageType === 'long') { // Don't throw this error 5 times.
            self.xrw.logError(`SGDB found no matching games for title "${self.proxy.title}"`)
          }
          self.proxy.completed();
          resolve();
        } else {
          // convert sgdbId to steamId
          // return CDN urls
          for(let artworkType of artworkTypes) {
            if(self.proxy.imageType === artworkType) {
              self.proxy.image({
                imageProvider: imageProviderNames.steamCDN,
                imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/400/${steamArtworkDict[artworkType]}`,
                loadStatus: 'notStarted'
              })
            }
          }
          self.proxy.completed();
          resolve();
        }
      }).catch((error: string) => {
        self.xrw.logError(error);
        self.proxy.completed();
        resolve();
      });
    })
  }

  stopUrlDownload() {
    this.xrw.cancel();
  }
}

new GenericProviderManager<SteamCDNProvider>(SteamCDNProvider, 'steamCDN');
