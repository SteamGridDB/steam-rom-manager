// All in worker process(es)

import '../replace-diacritics';
import { FuzzyMatcher } from "../fuzzy-matcher";
import { FuzzyEventMap, ProviderPostEventMap, ProviderPostObject, ProviderReceiveEventMap, ImageContent, ImageProviderAPI, OnlineProviderType, ImageProviderName } from "../../models";

declare var self: DedicatedWorkerGlobalScope;

export abstract class GenericProvider {
  constructor(protected proxy: ProviderProxy<GenericProvider>) { }
  abstract retrieveUrls(): void;
  abstract stopUrlDownload(): void;
}

export class GenericProviderManager<T extends GenericProvider> {
  private listening: boolean = false;
  private _filterIsEnabled: boolean = false;
  private _fuzzyMatcher = new FuzzyMatcher(this.fuzzyCallback.bind(this));
  private instanceMap = new Map<string, T>();
  private isTimedOut: boolean = false;

  constructor(private provider: new (proxy: ProviderProxy<T>) => T, private _providerName: OnlineProviderType) {
    if (!this.listening) {
      self.addEventListener('message', this.onMessage.bind(this));
      this.listening = true;
    }
  }

  get filterIsEnabled() {
    return this._filterIsEnabled;
  }

  get fuzzyMatcher() {
    return this._fuzzyMatcher;
  }

  get providerName() {
    return this._providerName;
  }

  get timedOut() {
    return this.isTimedOut;
  }

  timeout(timeInMs: number) {
    if (!this.isTimedOut) {
      this.isTimedOut = true;
      setTimeout(() => {
        this.isTimedOut = false;
      }, timeInMs);
    }
  }

  postMessage<K extends keyof ProviderPostEventMap>(event: K, data: ProviderPostEventMap[K]) {
    self.postMessage(<ProviderPostObject<K>>{ event: event, data: data });
  }

  newInstance(id: string, title: string, imageType: string, imageProviderAPIs: ImageProviderAPI[OnlineProviderType]): Map<string,T> {
    return this.instanceMap.set(id, new this.provider(new ProviderProxy<T>(id, title, imageType, imageProviderAPIs, this)));
  }

  removeInstance(id: string) {
    return this.instanceMap.delete(id);
  }
  
  // How worker handles receiving a message from main process
  private onMessage(event: MessageEvent) {
    //add back self.name == this.providerName to if statement if workers are intercepting each other's messages
    if (event.data && event.data.event) {
      switch ((event.data.event as keyof ProviderReceiveEventMap)) {
        case 'fuzzyList':
          this._fuzzyMatcher.setFuzzyList((event.data.data as ProviderReceiveEventMap['fuzzyList']).list || null);
          break;
        case 'retrieveUrls':
          {
            let data = (event.data.data as ProviderReceiveEventMap['retrieveUrls']);
            this.newInstance(data.id, data.title, data.imageType,data.imageProviderAPIs).get(data.id).retrieveUrls();
          }
          break;
        case 'stopDownloads':
          {
            let data = (event.data.data as ProviderReceiveEventMap['stopDownloads']);
            for (let value of this.instanceMap.values()) {
              value.stopUrlDownload();
            }
          }
          break;
        case 'toggleFiltering':
          this._filterIsEnabled = (event.data.data as ProviderReceiveEventMap['toggleFiltering']).enable;
          break;
        default:
          break;
      }
    }
  }

  private fuzzyCallback<K extends keyof FuzzyEventMap>(event: K, data: FuzzyEventMap[K]) {
    this.postMessage('fuzzyEvent', { event: event, data: data });
  }
};

export class ProviderProxy<T extends GenericProvider> {
  constructor(private _id: string, private _title: string, private _imageType: string, private _imageProviderAPIs: ImageProviderAPI[OnlineProviderType],  private _manager: GenericProviderManager<T>) { 
  }

  get title() {
    return this._title;
  }

  get imageProviderAPIs() {
    return this._imageProviderAPIs;
  }

  get imageType() {
    return this._imageType;
  }

  get filter() {
    return this._manager.filterIsEnabled;
  }

  get fuzzyMatcher() {
    return this._manager.fuzzyMatcher;
  }

  get providerName() {
    return this._manager.providerName;
  }

  timeout(timeInSeconds: number) {
    if (!this._manager.timedOut) {
      this._manager.timeout(timeInSeconds * 1000);
      this._manager.postMessage('timeout', { provider: this.providerName, time: timeInSeconds, id: this._id });
    }
  }

  error(error: number | string, url?: string) {
    this._manager.postMessage('error', { error: error, title: this._title, provider: this.providerName, id: this._id, url: url });
  }

  image(content: ImageContent) {
    this._manager.postMessage('image', { content: content, id: this._id, provider: this.providerName });
  }

  completed() {
    this._manager.postMessage('completed', { title: this._title, id: this._id });
    this._manager.removeInstance(this._id);
  }
};
