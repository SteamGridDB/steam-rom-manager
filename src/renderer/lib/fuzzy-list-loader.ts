import { Http } from '@angular/http';
import { FuzzyListTimestamps, FuzzyEventCallback, FuzzyError } from "../models";
import { readJson, writeJson } from "../../shared/lib";
import { FuzzyMatcher } from "./fuzzy-matcher";
import { BehaviorSubject } from "rxjs";
import * as paths from "../../shared/paths";

export class FuzzyListLoader {
    private list = new BehaviorSubject<{ totalGames: number, games: string[] }>({ totalGames: 0, games: [] });
    private checkInterval: number = 43200000; //every 12 h
    private forcedUpdate: number = 604800000; //every week
    private timeout: number = 120000; //timeout

    constructor(private http: Http, private eventCallback: FuzzyEventCallback, private isOfflineMode?: () => boolean, private timestamps?: FuzzyListTimestamps) {
        this.setTimestamps(timestamps || { check: 0, download: 0 });
    }

    observeList() {
        return this.list.asObservable();
    }

    setEventCallback(eventCallback: FuzzyEventCallback) {
        this.eventCallback = eventCallback;
    }

    setTimestamps(timestamps: FuzzyListTimestamps) {
        this.timestamps = timestamps;
    }

    getListAndCache() {
        return this.list.getValue();
    }

    loadList(offlineMode?: boolean) {
        let isOffline = offlineMode !== undefined ? offlineMode : (this.isOfflineMode ? this.isOfflineMode() : true);

        return this.readList().then((list) => {
            if (this.list.getValue() !== list)
                this.list.next(list);

            let currentTime = new Date().getTime();
            if ((currentTime - this.timestamps.download > this.forcedUpdate || this.list.getValue().totalGames === 0) && !isOffline) {
                this.eventCallback('info', { info: 'downloading' });
                return this.downloadList().then((listAndCache) => {
                    this.list.next(listAndCache);
                    this.timestamps.download = currentTime;
                    this.timestamps.check = currentTime;
                    this.eventCallback('info', { info: 'successfulDownload' });
                    return this.saveList().then(() => this.eventCallback('newTimestamps', this.timestamps));
                });
            }
            else if (currentTime - this.timestamps.check > this.checkInterval && !isOffline) {
                this.eventCallback('info', { info: 'checkingIfListIsUpToDate' });
                return this.getTotalCount().then((countInDatabase) => {
                    if (this.list.getValue().totalGames !== countInDatabase) {
                        this.eventCallback('info', { info: 'listIsOutdated' });
                        return this.downloadList().then((list) => {
                            this.list.next(list);
                            this.timestamps.download = currentTime;
                            this.timestamps.check = currentTime;
                            this.eventCallback('info', { info: 'successfulDownload' });
                            return this.saveList().then(() => this.eventCallback('newTimestamps', this.timestamps));
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
        return this.list.getValue().totalGames > 0;
    }

    isUpToDate() {
        let currentTime = new Date().getTime();

        return !(currentTime - this.timestamps.download > this.forcedUpdate || currentTime - this.timestamps.check > this.checkInterval);
    }

    createFuzzyMatcher() {
        return new FuzzyMatcher(this.eventCallback, this.list.getValue() || null);
    }

    saveList() {
        let fuzzyList = {
            totalGames: this.list.getValue().totalGames,
            games: this.list.getValue().games
        };
        return writeJson(paths.fuzzyList, fuzzyList);
    }

    resetList() {
        this.timestamps.download = 0;
        this.timestamps.check = 0;
        this.list.next({ totalGames: 0, games: [] });
        return this.saveList().then(() => this.eventCallback('newTimestamps', this.timestamps)).then(() => this.loadList());
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

    private readList() {
        return Promise.resolve().then(() => {
            if (this.list.getValue().totalGames === 0 || this.list.getValue().games.length === 0) {
                return readJson(paths.fuzzyList, { totalGames: 0, games: [] }).then((data) => {
                    return data;
                });
            }
            else
                return this.list.getValue();
        });
    }
}