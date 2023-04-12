import { ProviderPostEventMap, ProviderCallback, ProviderReceiveEventMap, ProviderReceiveObject, ImageProviderAPI } from '../models';
import { FuzzyService, LoggerService, SettingsService } from "../renderer/services";
import { imageProviders } from './image-providers';
import { availableProviders, providerInfo } from './image-providers/available-providers';
import { providerInfoLang } from './image-providers/available-providers-lang';
import { APP } from '../variables';
import { queue } from "async";
import { Subject } from "rxjs";
import * as _ from 'lodash';

type QueueTask = { title: string, imageType: string, imageProviderAPIs: ImageProviderAPI, eventCallback: ProviderCallback };
const _queue = true ? undefined as never : queue<QueueTask, void>((task, callback) => { });
type AsyncQueue = typeof _queue;

export class ImageProvider {
  private availableProviders: { [key: string]: { worker: Worker, queue: AsyncQueue } } = {};
  private callbackMap = new Map<string, { queueCallback: () => void, eventCallback: ProviderCallback }>();
  private filterIsEnabled: boolean = false;
  private stopped: Subject<void> = new Subject();

  constructor(private fuzzyService: FuzzyService, private loggerService: LoggerService) {
    let key: keyof typeof imageProviders
    for (key in imageProviders) {
      this.availableProviders[key] = {
        worker: imageProviders[key],
        queue: this.createQueue(key)
      };
      this.availableProviders[key].worker.addEventListener('message', this.messageEvent.bind(this));
      this.availableProviders[key].worker.addEventListener('error', this.errorEvent.bind(this));
    }
  }

  private get lang() {
    return APP.lang.imageProvider;
  }

  private createQueue(key: string) {
    if (this.availableProviders[key] && this.availableProviders[key].queue)
      this.availableProviders[key].queue.kill();

    return queue<QueueTask, void>((task, callback) => {
      let id = _.uniqueId();
      this.callbackMap.set(id, { eventCallback: task.eventCallback, queueCallback: callback });
      this.postMessage(this.availableProviders[key].worker, 'retrieveUrls', { id: id, imageType: task.imageType, imageProviderAPIs: task.imageProviderAPIs, title: task.title });
    }, 10);
  }

  toggleFilter(enable: boolean) {
    if (this.filterIsEnabled !== enable) {
      for (let key in this.availableProviders) {
        this.postMessage(this.availableProviders[key].worker, 'toggleFiltering', { enable: enable });
      }
    }
  }

  setFuzzyList(list: { totalGames: number, games: string[] }) {
    for (let key in this.availableProviders) {
      this.postMessage(this.availableProviders[key].worker, 'fuzzyList', { list });
    }
  }

  getAvailableProviders() {
    return availableProviders;
  }

  getProviderInfo(provider: string) {
    return providerInfo[provider];
  }
  getProviderInfoLang(provider: string) {
    return providerInfoLang[provider];
  }

  retrieveUrls(title: string, imageType: string, imageProviderAPIs: ImageProviderAPI, providers: string[], eventCallback: ProviderCallback) {
    for (let i = 0; i < providers.length; i++) {
      if (this.availableProviders[providers[i]])
        this.availableProviders[providers[i]].queue.push({ title, imageType, imageProviderAPIs, eventCallback });
      else
        eventCallback('completed', { title: title });
    }
  }

  stopUrlDownload() {
    for (let key in this.availableProviders) {
      let provider = this.availableProviders[key];

      provider.queue = this.createQueue(key);
      this.postMessage(provider.worker, 'stopDownloads', null);
    }

    this.callbackMap.clear();
    this.stopped.next();
  }

  get stopEvent() {
    return this.stopped.asObservable();
  }

  private postMessage<K extends keyof ProviderReceiveEventMap>(worker: Worker, event: K, data: ProviderReceiveEventMap[K]) {
    worker.postMessage(<ProviderReceiveObject<K>>{ event: event, data: data });
  }

  private messageEvent(event: MessageEvent) {
    if (event.data && event.data.event) {
      switch ((event.data.event as keyof ProviderPostEventMap)) {
        case 'error':
          {
          let data = (event.data.data as ProviderPostEventMap['error']);
          if (this.callbackMap.has(data.id)) {
            this.callbackMap.get(data.id).eventCallback('error', { provider: data.provider, title: data.title, error: data.error, url: data.url });
          }
        }
        break;
        case 'timeout':
          {
          let data = (event.data.data as ProviderPostEventMap['timeout']);
          if (this.callbackMap.has(data.id)) {
            this.callbackMap.get(data.id).eventCallback('timeout', { provider: data.provider, time: data.time });
          }
        }
        break;
        case 'image':
          {
          let data = (event.data.data as ProviderPostEventMap['image']);
          if (this.callbackMap.has(data.id)) {
            this.callbackMap.get(data.id).eventCallback('image', { content: data.content });
          }
        }
        break;
        case 'completed':
          {
          let data = (event.data.data as ProviderPostEventMap['completed']);
          if (this.callbackMap.has(data.id)) {
            let callbackData = this.callbackMap.get(data.id);
            this.callbackMap.delete(data.id);

            callbackData.eventCallback('completed', { title: data.title });
            callbackData.queueCallback();
          }
        }
        break;
        case 'fuzzyEvent':
          {
          let data = (event.data.data as ProviderPostEventMap['fuzzyEvent']);
          this.fuzzyService.eventCallback(data.event, data.data);
        }
        break;
        default:
          break;
      }
    }
  }

  private errorEvent(event: ErrorEvent) {
    if (event && event.error) {
      this.loggerService.error(this.lang.error.webWorkerError__i.interpolate({
        error: event.error
      }));
    }
    else {
      this.loggerService.error(this.lang.error.unknownWebWorkerError.interpolate({
        data: JSON.stringify(event, null, 4)
      }));
    }
  }
}
