import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
import SGDB from "steamgriddb";
import { imageProviderNames, sgdbIdRegex } from "./available-providers";



// TODO make the user input this
export const apiKey = "f80f92019254471cca9d62ff91c21eee";

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
      const grids = await client.getGrids({
        id: game.id,
        type: 'game',
        dimensions: ["600x900"]
      })
      game.posterUrl = grids.length ? grids[0].url: '';
    }
    return games;
  }

  retrieveUrls() {
    let self = this;
    let imageGameId: string;
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
          let res: any;
          if(self.proxy.imageType === 'long') {
            res = await self.client.getGrids(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizes, ["460x215","920x430"]),
              styles: self.proxy.imageProviderAPIs.styles
            }))
          } else if (self.proxy.imageType === 'tall') {
            res = await self.client.getGrids(Object.assign(params, {
              dimensions: ["600x900"],
              styles: self.proxy.imageProviderAPIs.styles
            }));
          } else if (self.proxy.imageType === 'hero') {
            res = await self.client.getHeroes(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizesHero, null),
              styles: self.proxy.imageProviderAPIs.stylesHero
            }));
          } else if (self.proxy.imageType === 'logo') {
            res = await self.client.getLogos(Object.assign(params, {
              styles: self.proxy.imageProviderAPIs.stylesLogo
            }));
          } else if (self.proxy.imageType === 'icon') {
            res = await self.client.getIcons(Object.assign(params, {
              dimensions: choose(self.proxy.imageProviderAPIs.sizesIcon, null),
              styles: self.proxy.imageProviderAPIs.stylesIcon
            }));
          }
          if(res !== null && res.length > 0) {
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
        }
      } catch(error) {
        self.xrw.logError(error);
        self.proxy.completed();
        resolve();
      }
    });
  }

  stopUrlDownload() {
    this.xrw.cancel();
  }
}

new GenericProviderManager<SteamGridDbProvider>(SteamGridDbProvider, 'sgdb');
