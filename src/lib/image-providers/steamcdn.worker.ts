import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import {apiKey} from "./steamgriddb.worker";
import { xRequestWrapper } from "./x-request-wrapper";
import SGDB from "steamgriddb";
import { artworkTypes, steamArtworkDict } from '../artwork-types'
import { imageProviderNames, sgdbIdRegex } from "./available-providers";

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
    this.xrw.promise = new Promise<void>(async (resolve) => {
      try {
        let chosenId: number;
        if(sgdbIdRegex.test(self.proxy.title)) {
          chosenId = parseInt(self.proxy.title.match(sgdbIdRegex)[1]);
        } else {
          chosenId = ((await self.client.searchGame(self.proxy.title))[0]||{}).id;
        }
        if(!chosenId) {
          if(self.proxy.imageType === 'long') { // Don't throw this error 5 times.
            self.xrw.logError(`SGDB found no matching games for title "${self.proxy.title}"`)
          }
          self.proxy.completed();
          resolve();
        } else {
            // convert sgdbId to steamId
            const platformData = ((await self.client.getGameById(chosenId, {platformdata: ['steam']}))||{}).external_platform_data;
            if(platformData && platformData.steam && platformData.steam.length) {
              const {id, metadata} = platformData.steam[0];
              // return CDN urls
              for(let artworkType of artworkTypes) {
                if(self.proxy.imageType === artworkType && id) {
                  if(self.proxy.imageType === 'icon' && metadata.clienticon) {
                    self.proxy.image({
                      imageProvider: imageProviderNames.steamCDN,
                      imageUrl: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${id}/${metadata.clienticon}.ico`,
                      loadStatus: 'notStarted'
                    })
                  } else {
                    self.proxy.image({
                      imageProvider: imageProviderNames.steamCDN,
                      imageUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/${steamArtworkDict[artworkType]}`,
                      loadStatus: 'notStarted'
                    })
                  }
                }
              }
            }
            self.proxy.completed();
            resolve();
          }
        } 
      catch(error) {
        self.xrw.logError(error);
        self.proxy.completed();
        resolve();
      };
    })
  }

  stopUrlDownload() {
    this.xrw.cancel();
  }
}

new GenericProviderManager<SteamCDNProvider>(SteamCDNProvider, 'steamCDN');
