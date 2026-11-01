import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import {
  ImageProviderAPI,
  OnlineProviderType,
  ProviderCallback,
} from "../../models";
import {
  onlineProviders,
  providerInfo,
} from "../../lib/image-providers/available-providers";
import { providerInfoLang } from "../../lib/image-providers/available-providers-lang";
import { CoreClientService } from "./core-client.service";

// Online artwork lookups, run by the ArtworkProviders in the main process.
// Same interface as ArtworkProviders; results stream back as events.
class RemoteArtworkProviders {
  private callbacks = new Map<string, ProviderCallback>();
  private nextId = 0;
  private stopped = new Subject<void>();

  constructor(private coreClient: CoreClientService) {
    this.coreClient.client.on("providers:event", ({ id, event, data }) => {
      const callback = this.callbacks.get(id);
      if (callback) {
        if (event === "completed") {
          this.callbacks.delete(id);
        }
        callback(event as any, data);
      }
    });
  }

  get stopEvent() {
    return this.stopped.asObservable();
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
    const id = String(this.nextId++);
    this.callbacks.set(id, eventCallback);
    this.coreClient.client.call(
      "providers",
      "retrieve",
      id,
      title,
      imageType,
      imageProviderAPIs,
      provider,
    );
  }

  // Abandons all lookups; their late results are ignored. Takes effect
  // locally right away (the preview relies on that).
  stopUrlDownload() {
    this.callbacks.clear();
    this.coreClient.client.call("providers", "stopUrlDownload");
    this.stopped.next();
  }
}

@Injectable()
export class ImageProviderService {
  readonly instance: RemoteArtworkProviders;

  constructor(coreClient: CoreClientService) {
    this.instance = new RemoteArtworkProviders(coreClient);
  }
}
