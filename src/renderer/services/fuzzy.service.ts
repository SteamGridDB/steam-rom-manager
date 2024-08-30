import { Injectable } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SettingsService } from "./settings.service";
import { FuzzyEventMap, AppSettings, FuzzyEventCallback } from "../../models";
import { APP } from "../../variables";
import { FuzzyListLoader, FuzzyMatcher } from "../../lib";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class FuzzyService {
  private appSettings: AppSettings;
  private fuzzyListLoader: FuzzyListLoader;
  private fuzzyListMatcher: FuzzyMatcher;
  private currentCacheEntries: number;

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService,
    private settingsService: SettingsService,
  ) {
    this.fuzzyListLoader = new FuzzyListLoader(
      this.http,
      this.eventCallback.bind(this),
      () => this.appSettings.offlineMode,
    );
    this.fuzzyListMatcher = new FuzzyMatcher(this.eventCallback.bind(this));

    this.fuzzyListLoader.observeList().subscribe((list) => {
      this.fuzzyListMatcher.setFuzzyList(list);
    });

    this.fuzzyListLoader.observeCache().subscribe((data) => {
      this.currentCacheEntries = Object.keys(data).length;
      this.fuzzyListMatcher.setFuzzyCache(data);
    });

    this.settingsService.onLoad((appSettings) => {
      this.appSettings = appSettings;
      this.fuzzyListLoader.setTimestamps(appSettings.fuzzyMatcher.timestamps);
      this.fuzzyListLoader.loadCache().then(() => {
        return this.fuzzyListLoader.loadList();
      });
    });

    setInterval(() => {
      this.saveCacheIfNeeded();
    }, 300000 /*5 mins*/);
  }

  get fuzzyLoader() {
    return this.fuzzyListLoader;
  }

  get fuzzyMatcher() {
    return this.fuzzyListMatcher;
  }

  saveCacheIfNeeded() {
    return Promise.resolve().then(() => {
      let cacheEntries = Object.keys(this.fuzzyLoader.getCache()).length;
      if (
        this.currentCacheEntries != undefined &&
        this.currentCacheEntries !== cacheEntries
      ) {
        this.currentCacheEntries = cacheEntries;
        return this.fuzzyLoader.saveCache();
      }
    });
  }

  private get lang() {
    return APP.lang.fuzzyMatcher;
  }

  eventCallback<K extends keyof FuzzyEventMap>(
    event: K,
    data: FuzzyEventMap[K],
  ) {
    switch (event) {
      case "info":
        if (!this.appSettings.fuzzyMatcher.verbose) break;

        switch ((data as FuzzyEventMap["info"]).info) {
          case "checkingIfListIsUpToDate":
            this.loggerService.fuzzy(this.lang.info.checkingIfListIsUpToDate);
            break;
          case "downloading":
            this.loggerService.fuzzy(this.lang.info.downloading);
            break;
          case "listIsOutdated":
            this.loggerService.fuzzy(this.lang.info.listIsOutdated);
            break;
          case "listIsUpToDate":
            this.loggerService.fuzzy(this.lang.info.listIsUpToDate);
            break;
          case "successfulDownload":
            this.loggerService.fuzzy(this.lang.info.successfulDownload);
            break;
          case "match":
            this.loggerService.fuzzy(
              this.lang.info.match__i.interpolate({
                fuzzyTitle: (data as FuzzyEventMap["info"]).stringA,
                extractedTitle: (data as FuzzyEventMap["info"]).stringB,
              }),
            );
            break;
          case "equal":
            this.loggerService.fuzzy(
              this.lang.info.equal__i.interpolate({
                a: (data as FuzzyEventMap["info"]).stringA,
                b: (data as FuzzyEventMap["info"]).stringB,
              }),
            );
            break;
          case "notEqual":
            this.loggerService.fuzzy(
              this.lang.info.notEqual__i.interpolate({
                a: (data as FuzzyEventMap["info"]).stringA,
                b: (data as FuzzyEventMap["info"]).stringB,
              }),
            );
            break;
          default:
            break;
        }
        break;
      case "error":
        if ((data as FuzzyEventMap["error"]).isFatal) {
          this.loggerService.error(this.lang.error.fatalError);
        }

        switch ((data as FuzzyEventMap["error"]).error) {
          case "totalGamesIsUndefined":
            this.loggerService.error(this.lang.error.totalGamesIsUndefined);
            break;
          case "unknownError":
            this.loggerService.error((data as FuzzyEventMap["error"]).errorMsg);
            break;
          default:
            break;
        }
        break;
      case "newTimestamps":
        this.appSettings.fuzzyMatcher.timestamps =
          data as FuzzyEventMap["newTimestamps"];
        this.settingsService.saveAppSettings();
      default:
        break;
    }
  }
}
