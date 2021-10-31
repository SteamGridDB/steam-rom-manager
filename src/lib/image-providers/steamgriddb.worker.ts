import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
const SGDB = require("steamgriddb");

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
      self.client.searchGame(self.proxy.title).then((res: any)=>{

        //eventually the user should have the ability to change this
        let chosenIndex=0;

        let query: Promise<any>;
        if(self.proxy.imageType === 'long') {
          query = self.client.getGridsById(res[chosenIndex].id,undefined,["legacy","460x215","920x430"]);
        } else if (self.proxy.imageType === 'tall') {
          query = self.client.getGridsById(res[chosenIndex].id,undefined,["600x900"]);
        } else if (self.proxy.imageType === 'hero') {
          query = self.client.getHeroes({id: res[chosenIndex].id, type: 'game'});
        } else if (self.proxy.imageType === 'logo') {
          query = self.client.getLogos({id: res[chosenIndex].id, type: 'game'});
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
