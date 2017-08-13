import { Http } from '@angular/http';
import { FuzzyListTimestamps, FuzzyEventCallback, FuzzyError } from "../models";
import { readJson, writeJson } from "../../shared/lib";
import { FuzzyMatcher } from "./fuzzy-matcher";
import { BehaviorSubject } from "rxjs";
import * as paths from "../../shared/paths";

export class FuzzyListLoader {
    private listAndCache = new BehaviorSubject<{ totalGames: number, games: string[], cache: { [key: string]: any } }>({ totalGames: 0, games: [], cache: {} });
    private checkInterval: number = 43200000; //every 12 h
    private forcedUpdate: number = 604800000; //every week
    private timeout: number = 120000; //timeout

    constructor(private http: Http, private eventCallback: FuzzyEventCallback, private isOfflineMode?: () => boolean, private timestamps?: FuzzyListTimestamps) {
        this.setTimestamps(timestamps || { check: 0, download: 0 });
    }

    observeListAndCache() {
        return this.listAndCache.asObservable();
    }

    setEventCallback(eventCallback: FuzzyEventCallback) {
        this.eventCallback = eventCallback;
    }

    setTimestamps(timestamps: FuzzyListTimestamps) {
        this.timestamps = timestamps;
    }

    getListAndCache() {
        return this.listAndCache.getValue();
    }

    loadList(offlineMode?: boolean) {
        let isOffline = offlineMode !== undefined ? offlineMode : (this.isOfflineMode ? this.isOfflineMode() : true);

        return this.readListAndCache().then((listAndCache) => {
            if (this.listAndCache.getValue() !== listAndCache)
                this.listAndCache.next(listAndCache);

            let currentTime = new Date().getTime();
            if ((currentTime - this.timestamps.download > this.forcedUpdate || this.listAndCache.getValue().totalGames === 0) && !isOffline) {
                this.eventCallback('info', { info: 'downloading' });
                return this.downloadList().then((listAndCache) => {
                    this.listAndCache.next(listAndCache);
                    this.timestamps.download = currentTime;
                    this.timestamps.check = currentTime;
                    this.eventCallback('info', { info: 'successfulDownload' });
                    return this.saveList().then(() => this.saveCache()).then(() => this.eventCallback('newTimestamps', this.timestamps));
                });
            }
            else if (currentTime - this.timestamps.check > this.checkInterval && !isOffline) {
                this.eventCallback('info', { info: 'checkingIfListIsUpToDate' });
                return this.getTotalCount().then((countInDatabase) => {
                    if (this.listAndCache.getValue().totalGames !== countInDatabase) {
                        this.eventCallback('info', { info: 'listIsOutdated' });
                        return this.downloadList().then((listAndCache) => {
                            this.listAndCache.next(listAndCache);
                            this.timestamps.download = currentTime;
                            this.timestamps.check = currentTime;
                            this.eventCallback('info', { info: 'successfulDownload' });
                            return this.saveList().then(() => this.saveCache()).then(() => this.eventCallback('newTimestamps', this.timestamps));
                        });
                    }
                    else {
                        this.eventCallback('info', { info: 'listIsUpToDate' });
                        this.timestamps.check = currentTime;
                        return this.eventCallback('newTimestamps', this.timestamps);
                    }
                });
            }
        }).catch((error) => {
            if (error instanceof Error)
                this.eventCallback('error', { error: 'unknownError', isFatal: true, errorMsg: error.message });
            else
                this.eventCallback('error', { error: (error as FuzzyError), isFatal: true });
        });
    }

    isLoaded() {
        return this.listAndCache.getValue().totalGames > 0;
    }

    isUpToDate() {
        let currentTime = new Date().getTime();

        return !(currentTime - this.timestamps.download > this.forcedUpdate || currentTime - this.timestamps.check > this.checkInterval);
    }

    createFuzzyMatcher() {
        return new FuzzyMatcher(this.eventCallback, this.listAndCache.getValue() || null);
    }

    saveList() {
        let fuzzyList = {
            totalGames: this.listAndCache.getValue().totalGames,
            games: this.listAndCache.getValue().games
        };
        return writeJson(paths.fuzzyList, fuzzyList);
    }

    saveCache() {
        return writeJson(paths.fuzzyCache, this.listAndCache.getValue().cache);
    }

    resetList(){
        this.timestamps.download = 0;
        this.timestamps.check = 0;
        this.listAndCache.next({ totalGames: 0, games: [], cache: {} });
        return this.saveList().then(() => this.saveCache()).then(() => this.eventCallback('newTimestamps', this.timestamps)).then(() => this.loadList());
    }

    private getTotalCount() {
        return new Promise<number>((resolve, reject) => {
            this.http.get('http://www.steamgriddb.com/api/games/?total').timeout(this.timeout).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        if (parsedBody['totalGames'] !== undefined)
                            resolve(parseInt(parsedBody['totalGames']));
                        else
                            reject('totalGamesIsUndefined');
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    private downloadList() {
        return new Promise<{ totalGames: number, games: string[], cache: { [key: string]: any } }>((resolve, reject) => {
            this.http.get('http://www.steamgriddb.com/api/games/').timeout(this.timeout).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        resolve(Object.assign(parsedBody, { cache: {} }));
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    private readListAndCache() {
        return Promise.resolve().then(() => {
            if (this.listAndCache.getValue().totalGames === 0 || this.listAndCache.getValue().games.length === 0) {
                let list: { totalGames: number, games: string[] } = undefined;
                return readJson(paths.fuzzyList, { totalGames: 0, games: [] }).then((data) => {
                    list = data;
                    return readJson(paths.fuzzyCache, {}).then((data) => {
                        return Object.assign(list, { cache: data });
                    });
                });
            }
            else
                return this.listAndCache.getValue();
        });
    }
}