import { HttpClient } from "@angular/common/http";
import { FuzzyListTimestamps, FuzzyEventCallback, FuzzyError } from "../models";
import { FuzzyMatcher } from "./fuzzy-matcher";
import { BehaviorSubject } from "rxjs";
import { timeout } from "rxjs/operators";
import * as paths from "../paths";
import * as json from "./helpers/json";

export class FuzzyListLoader {
  private list = new BehaviorSubject<{ totalGames: number; games: string[] }>({
    totalGames: 0,
    games: [],
  });
  private cache = new BehaviorSubject<{ [key: string]: any }>({});
  private checkInterval: number = 43200000; //every 12 h
  private forcedUpdate: number = 604800000; //every week
  private timeout: number = 120000; //timeout

  constructor(
    private http: HttpClient,
    private eventCallback: FuzzyEventCallback,
    private isOfflineMode?: () => boolean,
    private timestamps?: FuzzyListTimestamps,
  ) {
    this.setTimestamps(timestamps || { check: 0, download: 0 });
  }

  observeList() {
    return this.list.asObservable();
  }

  observeCache() {
    return this.cache.asObservable();
  }

  setEventCallback(eventCallback: FuzzyEventCallback) {
    this.eventCallback = eventCallback;
  }

  setTimestamps(timestamps: FuzzyListTimestamps) {
    this.timestamps = timestamps;
  }

  getList() {
    return this.list.getValue();
  }

  getCache() {
    return this.cache.getValue();
  }

  loadList(offlineMode?: boolean) {
    let isOffline =
      offlineMode !== undefined
        ? offlineMode
        : this.isOfflineMode
          ? this.isOfflineMode()
          : true;

    return this.readList()
      .then((list) => {
        if (this.list.getValue() !== list) this.list.next(list);

        let currentTime = new Date().getTime();
        if (
          (currentTime - this.timestamps.download > this.forcedUpdate ||
            this.list.getValue().totalGames === 0) &&
          !isOffline
        ) {
          this.eventCallback("info", { info: "downloading" });
          return this.downloadList().then((listAndCache) => {
            this.list.next(listAndCache);
            this.timestamps.download = currentTime;
            this.timestamps.check = currentTime;
            this.eventCallback("info", { info: "successfulDownload" });
            return this.saveList().then(() =>
              this.eventCallback("newTimestamps", this.timestamps),
            );
          });
        } else if (
          currentTime - this.timestamps.check > this.checkInterval &&
          !isOffline
        ) {
          this.eventCallback("info", { info: "checkingIfListIsUpToDate" });
          return this.getTotalCount().then((countInDatabase) => {
            if (this.list.getValue().totalGames !== countInDatabase) {
              this.eventCallback("info", { info: "listIsOutdated" });
              return this.downloadList().then((list) => {
                this.list.next(list);
                this.timestamps.download = currentTime;
                this.timestamps.check = currentTime;
                this.eventCallback("info", { info: "successfulDownload" });
                return this.saveList().then(() =>
                  this.eventCallback("newTimestamps", this.timestamps),
                );
              });
            } else {
              this.eventCallback("info", { info: "listIsUpToDate" });
              this.timestamps.check = currentTime;
              return this.eventCallback("newTimestamps", this.timestamps);
            }
          });
        }
      })
      .catch((error) => {
        if (error instanceof Error)
          this.eventCallback("error", {
            error: "unknownError",
            isFatal: true,
            errorMsg: error.message,
          });
        else
          this.eventCallback("error", {
            error: error as FuzzyError,
            isFatal: true,
          });
      });
  }

  loadCache() {
    return json.read(paths.fuzzyCache, {}).then((data) => {
      this.cache.next(data);
    });
  }

  isLoaded() {
    return this.list.getValue().totalGames > 0;
  }

  isUpToDate() {
    let currentTime = new Date().getTime();

    return !(
      currentTime - this.timestamps.download > this.forcedUpdate ||
      currentTime - this.timestamps.check > this.checkInterval
    );
  }

  createFuzzyMatcher() {
    return new FuzzyMatcher(this.eventCallback, this.list.getValue() || null);
  }

  saveList() {
    let fuzzyList = {
      totalGames: this.list.getValue().totalGames,
      games: this.list.getValue().games,
    };
    return json.write(paths.fuzzyList, fuzzyList);
  }

  saveCache() {
    return json.write(paths.fuzzyCache, this.cache.getValue());
  }

  resetList() {
    this.timestamps.download = 0;
    this.timestamps.check = 0;
    this.list.next({ totalGames: 0, games: [] });
    return this.saveList()
      .then(() => this.eventCallback("newTimestamps", this.timestamps))
      .then(() => this.loadList());
  }

  resetCache() {
    this.cache.next({});
    return this.saveCache();
  }

  private getTotalCount() {
    return new Promise<number>((resolve, reject) => {
      this.http
        .get("https://steamgriddb.com/api/games/?total")
        .pipe(timeout(this.timeout))
        .subscribe(
          (response: { [k: string]: any; totalGames: string }) => {
            try {
              if (response["totalGames"] !== undefined)
                resolve(parseInt(response["totalGames"]));
              else reject("totalGamesIsUndefined");
            } catch (error) {
              reject(error);
            }
          },
          (error: string) => {
            reject(error);
          },
        );
    });
  }

  private downloadList() {
    return new Promise<{
      totalGames: number;
      games: string[];
      cache: { [key: string]: any };
    }>((resolve, reject) => {
      this.http
        .get("https://steamgriddb.com/api/games/")
        .pipe(timeout(this.timeout))
        .subscribe(
          (response: {
            [k: string]: any;
            totalGames: number;
            games: string[];
          }) => {
            try {
              resolve(Object.assign(response, { cache: {} }));
            } catch (error) {
              reject(error);
            }
          },
          (error: string) => {
            reject(error);
          },
        );
    });
  }

  private readList() {
    return Promise.resolve().then(() => {
      if (
        this.list.getValue().totalGames === 0 ||
        this.list.getValue().games.length === 0
      ) {
        return json
          .read(paths.fuzzyList, { totalGames: 0, games: [] })
          .then((data) => {
            return data;
          });
      } else return this.list.getValue();
    });
  }
}
