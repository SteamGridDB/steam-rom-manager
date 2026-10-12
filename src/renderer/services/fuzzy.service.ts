import { Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SettingsService } from "./settings.service";
import { FuzzyStore } from "../../core/fuzzy-store";
import { Fetch } from "../../core/http";
import { FuzzyEventMap } from "../../models";

// Angular facade over the core FuzzyStore.
@Injectable()
export class FuzzyService {
  readonly store: FuzzyStore;

  constructor(
    private loggerService: LoggerService,
    private settingsService: SettingsService,
  ) {
    this.store = new FuzzyStore(
      this.loggerService,
      this.settingsService.store,
      globalThis.fetch.bind(globalThis) as Fetch,
    );
    this.settingsService.onLoad(() => this.store.load());
    this.store.startAutoSave();
  }

  get fuzzyLoader() {
    return this.store.loader;
  }

  get fuzzyMatcher() {
    return this.store.fuzzyMatcher;
  }

  saveCacheIfNeeded() {
    return this.store.saveCacheIfNeeded();
  }

  // For fuzzy events relayed from the image-provider workers.
  eventCallback<K extends keyof FuzzyEventMap>(
    event: K,
    data: FuzzyEventMap[K],
  ) {
    this.store.eventCallback(event, data);
  }
}
