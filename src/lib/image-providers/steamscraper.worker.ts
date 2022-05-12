import { GenericProvider, GenericProviderManager, ProviderProxy } from "./generic-provider";
import { xRequestWrapper } from "./x-request-wrapper";
import {ErrorResult, ImagesResult, ScrapeApi} from "steam-scraper-client"
import * as path from "path";

import * as md5 from "md5-file/index"

class SteamScraperProvider extends GenericProvider {
  private xrw: xRequestWrapper;
  private client: ScrapeApi;

  constructor(protected proxy: ProviderProxy) {
    super(proxy);
    this.xrw = new xRequestWrapper(proxy, true, 5, 8000);
    this.client = new ScrapeApi("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbiI6ImV5SjBlWEFpT2lKS1YxUWlMQ0poYkdjaU9pSklVekkxTmlKOS5leUoxYzJWeWJtRnRaU0k2SW5kcGRHaGxjbXRwYm1jeU5TSjkuZG5FejluelVMMk14YjhvWUZ6b1MwSTdoNXREdlA1QWxlay16R210US1PdyJ9._eANIWkeiym15LgNCvMGUQQbIqjdnxmGwPlXjdXHi_4")
  }

  retrieveUrls() {
    let self = this;
    this.xrw.promise = new Promise<void>(function (resolve) {
        let query: Promise<{response: any, body: ImagesResult | ErrorResult}> = self.client.scrape(path.basename(self.proxy.path), md5.sync(self.proxy.path));

        query.then((result: {response: any, body: ImagesResult | ErrorResult})=>{
          if (result.body instanceof ImagesResult) {
            let url: string;
            switch (self.proxy.imageType) {
              case "long": {
                url = result.body.images.head;
                break;
              }
              case "tall": {
                url = result.body.images.tall;
                break;
              }
              case "hero": {
                url = result.body.images.hero;
                break;
              }
              case "logo": {
                url = result.body.images.logo;
                break;
              }
              case "icon": {
                url = result.body.images.icon;
                break;
              }
            }
            self.proxy.image({
              imageProvider: 'SteamScraper',
              imageUrl: url,
              imageUploader: "ScreenScraper.fr",
              loadStatus: 'notStarted'
            });
          }
          self.proxy.completed();
          resolve();
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

new GenericProviderManager(SteamScraperProvider, 'SteamScraper');
