import {
  ProviderPostEventMap,
  ProviderCallback,
  ProviderReceiveEventMap,
  ProviderReceiveObject,
  ImageProviderAPI,
  OnlineProviderType,
} from "../models";
import {
  FuzzyService,
  LoggerService,
  SettingsService,
} from "../renderer/services";
import { imageProviders } from "./image-providers";
import {
  onlineProviders,
  providerInfo,
} from "./image-providers/available-providers";
import { providerInfoLang } from "./image-providers/available-providers-lang";
import { APP } from "../variables";
import { queue } from "async";
import { Subject } from "rxjs";
import * as _ from "lodash";

type QueueTask = {
  title: string;
  imageType: string;
  imageProviderAPIs: ImageProviderAPI[OnlineProviderType];
  eventCallback: ProviderCallback;
};
const _queue = true
  ? (undefined as never)
  : queue<QueueTask, void>((task, callback) => {});
type AsyncQueue = typeof _queue;

export class ImageProvider {
  private availableProviders: {
    [key: string]: { worker: Worker; queue: AsyncQueue };
  } = {};
  private callbackMap = new Map<
    string,
    { queueCallback: () => void; eventCallback: ProviderCallback }
  >();
  private filterIsEnabled: boolean = false;
  private stopped: Subject<void> = new Subject();

  constructor(
    private fuzzyService: FuzzyService,
    private loggerService: LoggerService,
  ) {
    for (let key of onlineProviders) {
      this.availableProviders[key] = {
        worker: imageProviders[key],
        queue: this.createQueue(key),
      };
      this.availableProviders[key].worker.addEventListener(
        "message",
        this.messageEvent.bind(this),
      );
      this.availableProviders[key].worker.addEventListener(
        "error",
        this.errorEvent.bind(this),
      );
    }
  }

  private get lang() {
    return APP.lang.imageProvider;
  }

  get stopEvent() {
    return this.stopped.asObservable();
  }

  private createQueue(key: string) {
    if (this.availableProviders[key] && this.availableProviders[key].queue)
      this.availableProviders[key].queue.kill();

    return queue<QueueTask, void>((task, callback) => {
      let id = _.uniqueId();
      this.callbackMap.set(id, {
        eventCallback: task.eventCallback,
        queueCallback: callback,
      });
      this.postMessage(this.availableProviders[key].worker, "retrieveUrls", {
        id: id,
        imageType: task.imageType,
        imageProviderAPIs: task.imageProviderAPIs,
        title: task.title,
      });
    }, 10);
  }

  toggleFilter(enable: boolean) {
    if (this.filterIsEnabled !== enable) {
      for (let key in this.availableProviders) {
        this.postMessage(
          this.availableProviders[key].worker,
          "toggleFiltering",
          { enable: enable },
        );
      }
    }
  }

  setFuzzyList(list: { totalGames: number; games: string[] }) {
    for (let key in this.availableProviders) {
      this.postMessage(this.availableProviders[key].worker, "fuzzyList", {
        list,
      });
    }
  }

  getAvailableProviders() {
    return onlineProviders;
  }

  getProviderInfo(provider: OnlineProviderType) {
    return providerInfo[provider];
  }
  getProviderInfoLang(provider: OnlineProviderType) {
    return providerInfoLang[provider];
  }

  retrieveUrls(
    title: string,
    imageType: string,
    imageProviderAPIs: ImageProviderAPI[OnlineProviderType],
    provider: OnlineProviderType,
    eventCallback: ProviderCallback,
  ) {
    if (this.availableProviders[provider])
      this.availableProviders[provider].queue.push({
        title,
        imageType,
        imageProviderAPIs,
        eventCallback,
      });
    else eventCallback("completed", { title: title });
  }

  stopUrlDownload() {
    for (let key in this.availableProviders) {
      let provider = this.availableProviders[key];
      provider.queue = this.createQueue(key);
      this.postMessage(provider.worker, "stopDownloads", null);
    }

    this.callbackMap.clear();
    this.stopped.next();
  }

  private postMessage<K extends keyof ProviderReceiveEventMap>(
    worker: Worker,
    event: K,
    data: ProviderReceiveEventMap[K],
  ) {
    worker.postMessage(<ProviderReceiveObject<K>>{ event: event, data: data });
  }

  private messageEvent(event: MessageEvent) {
    if (event.data && event.data.event) {
      switch (event.data.event as keyof ProviderPostEventMap) {
        case "error":
          {
            let data = event.data.data as ProviderPostEventMap["error"];
            if (this.callbackMap.has(data.id)) {
              this.callbackMap.get(data.id).eventCallback("error", {
                provider: data.provider,
                title: data.title,
                error: data.error,
                url: data.url,
              });
            }
          }
          break;
        case "timeout":
          {
            let data = event.data.data as ProviderPostEventMap["timeout"];
            if (this.callbackMap.has(data.id)) {
              this.callbackMap.get(data.id).eventCallback("timeout", {
                provider: data.provider,
                time: data.time,
              });
            }
          }
          break;
        case "image":
          {
            let data = event.data.data as ProviderPostEventMap["image"];
            if (this.callbackMap.has(data.id)) {
              this.callbackMap.get(data.id).eventCallback("image", {
                content: data.content,
                provider: data.provider,
              });
            }
          }
          break;
        case "completed":
          {
            let data = event.data.data as ProviderPostEventMap["completed"];
            if (this.callbackMap.has(data.id)) {
              let callbackData = this.callbackMap.get(data.id);
              this.callbackMap.delete(data.id);

              callbackData.eventCallback("completed", { title: data.title });
              callbackData.queueCallback();
            }
          }
          break;
        case "fuzzyEvent":
          {
            let data = event.data.data as ProviderPostEventMap["fuzzyEvent"];
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
      this.loggerService.error(
        this.lang.error.webWorkerError__i.interpolate({
          error: event.error,
        }),
      );
    } else {
      this.loggerService.error(
        this.lang.error.unknownWebWorkerError.interpolate({
          data: JSON.stringify(event, null, 4),
        }),
      );
    }
  }
}
