import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
import SGDB from "steamgriddb";
import { imageProviderNames, sgdbIdRegex } from "./available-providers";
import {apiKey} from "./api-key";

//NOTE: Workers must not import from one another.

export class SteamGridDbProvider extends GenericProvider {
  private xrw: xRequestWrapper<SteamGridDbProvider>;
  private client: any;

  constructor(protected proxy: ProviderProxy<SteamGridDbProvider>) {
    super(proxy);
    this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    this.client = new SGDB({key: apiKey});
  }

  static async retrieveIdsFromTitle(title: string): Promise<number[]> {
    const client = new SGDB({key: apiKey});
    if(sgdbIdRegex.test(title)) {
      return [parseInt(title.match(sgdbIdRegex)[1])];
    } else {
      const games = await client.searchGame(title);
      return games.map((game: any)=> game.id)
    }
  }

  static async retrievePossibleIds(title: string) {
    const client = new SGDB({key: apiKey});
    const games = await client.searchGame(title);
    for(const game of games) {
      const grids = (await client.getGrids({
        id: game.id,
        type: 'game',
        dimensions: ["600x900"]
      })).filter((grid: any)=>!grid.url.endsWith('?')); // Nintendo Sucks
      game.posterUrl = grids.length ? grids[0].url: '';
    }
    return games;
  }

  retrieveUrls() {
    let self = this;
    let imageGameId: string;
    this.xrw.promise = new Promise<void>((resolve) => {
      let idPromise: Promise<number> = null;
      if(sgdbIdRegex.test(self.proxy.title)) {
        idPromise = Promise.resolve(parseInt(self.proxy.title.match(sgdbIdRegex)[1]))
      } else {
        idPromise = self.client.searchGame(self.proxy.title).then((res: any) => (res[0]||{}).id);
      }
      idPromise.then((chosenId: number|undefined)=>{
        if(!chosenId) {
          if(self.proxy.imageType === 'long') { // Don't throw this error 5 times.
            self.xrw.logError(`SGDB found no matching games for title "${self.proxy.title}"`)
          }
          self.proxy.completed();
          resolve();
        } else {
          imageGameId = String(chosenId);
          let query: Promise<any>;
          let params = {
            id: chosenId,
            type: 'game',
            types: self.proxy.imageProviderAPIs.imageMotionTypes,
            nsfw: self.proxy.imageProviderAPIs.nsfw ? "any" : "false",
            humor: self.proxy.imageProviderAPIs.humor ? "any" : "false"
          };
          const choose = (x: any, fallback: string[]) => x && x.length ? x : fallback;
          if(self.proxy.imageType === 'long') {
            query = self.client.getGrids(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizes, ["460x215","920x430"]),
              styles: self.proxy.imageProviderAPIs.styles
            }))
          } else if (self.proxy.imageType === 'tall') {
            query = self.client.getGrids(Object.assign(params, {
              dimensions: ["600x900"],
              styles: self.proxy.imageProviderAPIs.styles
            }));
          } else if (self.proxy.imageType === 'hero') {
            query = self.client.getHeroes(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizesHero, null),
              styles: self.proxy.imageProviderAPIs.stylesHero
            }));
          } else if (self.proxy.imageType === 'logo') {
            query = self.client.getLogos(Object.assign(params, {
              styles: self.proxy.imageProviderAPIs.stylesLogo
            }));
          } else if (self.proxy.imageType === 'icon') {
            query = self.client.getIcons(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizesIcon, null),
              styles: self.proxy.imageProviderAPIs.stylesIcon
            }));
          }
          return query
        }
      })
      .then((res: any)=>{
        if(res !== null && res.length>0) {
          for (let i=0; i < res.length; i++) {
            self.proxy.image({
              imageProvider: imageProviderNames.sgdb,
              imageUrl: res[i].url,
              imageGameId: imageGameId,
              imageArtworkId: String(res[i].id),
              imageUploader: res[i].author.name,
              loadStatus: 'notStarted'
            });
          }
        }
        self.proxy.completed();
        resolve();
      })
      .catch((error: string) => {
        self.xrw.logError(error);
        self.proxy.completed();
        resolve();
      });
    });
  }

  stopUrlDownload() {
    this.xrw.cancel();
  }
}

new GenericProviderManager<SteamGridDbProvider>(SteamGridDbProvider, 'sgdb');
