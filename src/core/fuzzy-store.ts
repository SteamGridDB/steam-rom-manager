import { FuzzyEventMap, Logger } from "../models";
import { APP } from "../variables";
import { FuzzyMatcher } from "../lib/fuzzy-matcher";
import { FuzzyListLoader } from "../lib/fuzzy-list-loader";
import { SettingsStore } from "./settings-store";
import { Fetch } from "./http";

const cacheSaveInterval = 300000; // 5 minutes

// The fuzzy matcher and its list of known game titles (fuzzyList.json,
// refreshed from SteamGridDB) plus the match cache (fuzzyCache.json).
export class FuzzyStore {
  readonly loader: FuzzyListLoader;
  readonly fuzzyMatcher: FuzzyMatcher;
  private currentCacheEntries: number;
  private autoSaveTimer: ReturnType<typeof setInterval>;

  constructor(
    private logger: Logger,
    private settings: SettingsStore,
    fetch: Fetch,
  ) {
    this.loader = new FuzzyListLoader(
      fetch,
      this.eventCallback.bind(this),
      () => this.settings.get().offlineMode,
    );
    this.fuzzyMatcher = new FuzzyMatcher(this.eventCallback.bind(this));
    this.loader.observeList().subscribe((list) => {
      this.fuzzyMatcher.setFuzzyList(list);
    });
    this.loader.observeCache().subscribe((data) => {
      this.currentCacheEntries = Object.keys(data).length;
      this.fuzzyMatcher.setFuzzyCache(data);
    });
  }

  private get lang() {
    return APP.lang.fuzzyMatcher;
  }

  // Loads the cache and list (refreshing the list if due). Call once the
  // settings are loaded.
  async load() {
    this.loader.setTimestamps(this.settings.get().fuzzyMatcher.timestamps);
    await this.loader.loadCache();
    await this.loader.loadList();
  }

  // Periodically persists new cache entries; doesn't keep a process alive.
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(
      () => this.saveCacheIfNeeded(),
      cacheSaveInterval,
    );
    (this.autoSaveTimer as any).unref?.();
  }

  stopAutoSave() {
    clearInterval(this.autoSaveTimer);
  }

  getListInfo() {
    return { totalGames: this.loader.getList().totalGames };
  }

  resetList() {
    return this.loader.resetList();
  }

  resetCache() {
    return this.loader.resetCache();
  }

  async saveCacheIfNeeded() {
    const cacheEntries = Object.keys(this.loader.getCache()).length;
    if (
      this.currentCacheEntries != undefined &&
      this.currentCacheEntries !== cacheEntries
    ) {
      this.currentCacheEntries = cacheEntries;
      await this.loader.saveCache();
    }
  }

  private fuzzy(message: string) {
    if (this.logger.fuzzy) {
      this.logger.fuzzy(message);
    } else {
      this.logger.info(message);
    }
  }

  // Turns matcher/loader events into log messages and saved timestamps.
  eventCallback<K extends keyof FuzzyEventMap>(
    event: K,
    data: FuzzyEventMap[K],
  ) {
    switch (event) {
      case "info": {
        if (!this.settings.get().fuzzyMatcher.verbose) break;
        const info = data as FuzzyEventMap["info"];
        switch (info.info) {
          case "checkingIfListIsUpToDate":
          case "downloading":
          case "listIsOutdated":
          case "listIsUpToDate":
          case "successfulDownload":
            this.fuzzy(this.lang.info[info.info]);
            break;
          case "match":
            this.fuzzy(
              this.lang.info.match__i.interpolate({
                fuzzyTitle: info.stringA,
                extractedTitle: info.stringB,
              }),
            );
            break;
          case "equal":
            this.fuzzy(
              this.lang.info.equal__i.interpolate({
                a: info.stringA,
                b: info.stringB,
              }),
            );
            break;
          case "notEqual":
            this.fuzzy(
              this.lang.info.notEqual__i.interpolate({
                a: info.stringA,
                b: info.stringB,
              }),
            );
            break;
        }
        break;
      }
      case "error": {
        const error = data as FuzzyEventMap["error"];
        if (error.isFatal) {
          this.logger.error(this.lang.error.fatalError);
        }
        if (error.error === "totalGamesIsUndefined") {
          this.logger.error(this.lang.error.totalGamesIsUndefined);
        } else if (error.error === "unknownError") {
          this.logger.error(error.errorMsg);
        }
        break;
      }
      case "newTimestamps":
        this.settings.get().fuzzyMatcher.timestamps =
          data as FuzzyEventMap["newTimestamps"];
        this.settings.save();
        // (the window saves its whole copy of the settings: without this,
        // its next save puts the old timestamps back)
        this.settings.changed();
        break;
    }
  }
}
