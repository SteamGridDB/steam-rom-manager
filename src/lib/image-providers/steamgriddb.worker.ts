import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";

const SGDB = require("steamgriddb");
const idRegex: RegExp = /^\$\{gameid\:([0-9]*?)\}$/;

class SteamGridDbProvider extends GenericProvider {
  private xrw: xRequestWrapper;
  private client: any;

  constructor(protected proxy: ProviderProxy) {
    super(proxy);
    this.xrw = new xRequestWrapper(proxy, true, 3, 3000);
    this.client = new SGDB({key: "f80f92019254471cca9d62ff91c21eee"});
  }

  retrieveUrls() {
    let self = this;
    this.xrw.promise = new Promise<void>(function (resolve) {
      let idPromise: Promise<number> = null;
      if(idRegex.test(self.proxy.title)) {
        idPromise = Promise.resolve(parseInt(self.proxy.title.split(':')[1].slice(0,-1)))
      } else {
        idPromise = self.client.searchGame(self.proxy.title).then((res: any) => (res[0]||{}).id);
      }
      idPromise.then((chosenId: number|undefined)=>{
        if(!chosenId) {
          if(self.proxy.imageType === 'long') {
            self.xrw.logError(`SGDB found no matching games for title "${self.proxy.title}"`)
          }
          self.proxy.completed();
          resolve();
        } else {
          let query: Promise<any>;
          let params = {
            id: chosenId,
            type: 'game',
            types: self.proxy.imageProviderAPIs.SteamGridDB.imageMotionTypes,
            nsfw: self.proxy.imageProviderAPIs.SteamGridDB.nsfw ? "any" : "false",
            humor: self.proxy.imageProviderAPIs.SteamGridDB.humor ? "any" : "false"
          };
          if(self.proxy.imageType === 'long') {
            query = self.client.getGrids(Object.assign(params, {
              dimensions: ["legacy","460x215","920x430"],
              styles: self.proxy.imageProviderAPIs.SteamGridDB.styles
            }))
          } else if (self.proxy.imageType === 'tall') {
            query = self.client.getGrids(Object.assign(params, {
              dimensions: ["600x900"],
              styles: self.proxy.imageProviderAPIs.SteamGridDB.styles
            }));
          } else if (self.proxy.imageType === 'hero') {
            query = self.client.getHeroes(Object.assign(params, {
              styles: self.proxy.imageProviderAPIs.SteamGridDB.stylesHero
            }));
          } else if (self.proxy.imageType === 'logo') {
            query = self.client.getLogos(Object.assign(params, {
              styles: self.proxy.imageProviderAPIs.SteamGridDB.stylesLogo
            }));
          } else if (self.proxy.imageType === 'icon') {
            query = self.client.getIcons(Object.assign(params, {
              styles: self.proxy.imageProviderAPIs.SteamGridDB.stylesIcon
            }));
          }

          query.then((res: any)=>{
            if(res !== null && res.length>0) {
              for (let i=0; i < res.length; i++) {
                self.proxy.image({
                  imageProvider: 'SteamGridDB',
                  imageUrl: res[i].url,
                  imageUploader: res[i].author.name,
                  loadStatus: 'notStarted'
                });
              }
            }
            self.proxy.completed();
            resolve();
          })

        }
      }).catch((error: string) => {
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

new GenericProviderManager(SteamGridDbProvider, 'SteamGridDB');
