import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
const SGDB = require("steamgriddb");
import * as Bluebird from 'bluebird';
declare global { export interface Promise<T> extends Bluebird<T> {} }

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
    this.xrw.promise = new this.xrw.Bluebird<string>(function (resolve, reject, onCancel) {
      self.client.searchGame(self.proxy.title).then((res: any)=>{
        let query: Promise<any>;
        if(self.proxy.imageType === 'long') {
          query = self.client.getGridsById(res[0].id,undefined,["legacy","460x215"]);
        } else if (self.proxy.imageType === 'tall') {
          query = self.client.getGridsById(res[0].id,undefined,["600x900"]);
        } else if (self.proxy.imageType === 'hero') {
          query = self.client.getHeroes({id: res[0].id, type: 'game'});
        } else if (self.proxy.imageType === 'logo') {
          query = new Promise((res,rej)=>res([]));
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
      onCancel(()=>{
        return;
      });
    });
  }

  stopUrlDownload() {
    this.xrw.cancel();
  }
}

new GenericProviderManager(SteamGridDbProvider, 'SteamGridDB');
