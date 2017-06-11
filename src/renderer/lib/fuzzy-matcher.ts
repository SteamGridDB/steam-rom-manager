import { Http } from '@angular/http';
import { LoggerService, SettingsService } from "./../services";
import { FuzzyListTimestamps, ParsedData, ParsedDataWithFuzzy, AppSettings } from "../models";
import { readJson, writeJson } from "../lib";
import * as paths from "../../shared/paths";
import * as Fuzzy from "fuzzy";
import * as fs from 'fs-extra';

export class FuzzyMatcher {
    private list: { totalGames: number, games: string[] };
    private appSettings: AppSettings;
    private checkInterval: number = 43200000; //every 12 h
    private forcedUpdate: number = 604800000; //every week
    private timeout: number = 120000; //timeout

    constructor(private http: Http, private loggerService: LoggerService, private settingsService: SettingsService) {
        let settingsLoaded = this.settingsService.getLoadStatusObservable().subscribe((loaded) => {
            if (loaded) {
                this.appSettings = this.settingsService.getSettings();
                settingsLoaded.unsubscribe();
            }
        });
    }

    prepare() {
        let fuzzyListTimestamps = this.appSettings.fuzzyMatcher.timestamps;

        return this.readList().then((list) => {
            this.list = list;
            let currentTime = new Date().getTime();
            if ((currentTime - fuzzyListTimestamps.download > this.forcedUpdate || this.list.totalGames === 0) && this.listCanBeDownloaded()) {
                this.loggerService.fuzzy('Title list for fuzzy matching will be downloaded.');
                return this.downloadList().then((list) => {
                    this.list = list;
                    fuzzyListTimestamps.download = currentTime;
                    fuzzyListTimestamps.check = currentTime;
                    this.loggerService.fuzzy('Download was successful. Saving list.');
                    return this.saveList().then(() => this.settingsService.saveAppSettings());
                });
            }
            else if (currentTime - fuzzyListTimestamps.check > this.checkInterval && this.listCanBeDownloaded()) {
                this.loggerService.fuzzy('Checking if title list is up to date.');
                return this.getTotalCount().then((countInDatabase) => {
                    if (this.list.totalGames !== countInDatabase) {
                        this.loggerService.fuzzy('List is outdated. Title list for fuzzy matching will be downloaded.');
                        return this.downloadList().then((list) => {
                            this.list = list;
                            fuzzyListTimestamps.download = currentTime;
                            fuzzyListTimestamps.check = currentTime;
                            this.loggerService.fuzzy('Download was successful. Saving list.');
                            return this.saveList().then(() => this.settingsService.saveAppSettings());
                        });
                    }
                    else {
                        this.loggerService.fuzzy('Title list is up to date.');
                        fuzzyListTimestamps.check = currentTime;
                        return this.settingsService.saveAppSettings();
                    }
                });
            }
        }).catch((error) => {
            this.list = null;
            this.loggerService.error('Error occured while preparing "Fuzzy matcher". Fuzzy matching will be skipped.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
        });
    }

    fuzzyMatchParsedData(data: ParsedDataWithFuzzy, removeCharacters: boolean, removeBrackets: boolean, allowVerbose: boolean = true) {
        if (this.isReady()) {
            let matches: Fuzzy.FilterResult<string>[] = [];
            for (let i = 0; i < data.success.length; i++) {
                let extractedTitle = this.modifyString(data.success[i].extractedTitle, removeCharacters, removeBrackets);

                matches = Fuzzy.filter(extractedTitle, this.list.games);
                if (matches.length) {
                    data.success[i].fuzzyTitle = this.getBestMatch(extractedTitle, matches);
                    if (this.appSettings.fuzzyMatcher.verbose && allowVerbose)
                        this.loggerService.fuzzy(`Fuzzy title "${data.success[i].fuzzyTitle}" from "${data.success[i].extractedTitle}"`);
                }
            }
        }
        return data;
    }

    fuzzyMatchString(input: string, removeCharacters: boolean, removeBrackets: boolean, allowVerbose: boolean = true) {
        if (this.isReady()) {
            let extractedTitle = this.modifyString(input, removeCharacters, removeBrackets);

            let matches = Fuzzy.filter(extractedTitle, this.list.games);
            if (matches.length) {
                let bestMatch = this.getBestMatch(extractedTitle, matches);
                if (this.appSettings.fuzzyMatcher.verbose && allowVerbose)
                    this.loggerService.fuzzy(`Fuzzy title "${bestMatch}" from "${extractedTitle}"`);
                return bestMatch;
            }
        }
        return input;
    }

    fuzzyEqual(a: string, b: string, removeCharacters: boolean, removeBrackets: boolean, allowVerbose: boolean = true) {
        if (this.isReady()) {
            if (this.fuzzyMatchString(a, removeCharacters, removeBrackets, false) === this.fuzzyMatchString(b, removeCharacters, removeBrackets, false)) {
                if (this.appSettings.fuzzyMatcher.verbose && allowVerbose)
                    this.loggerService.fuzzy(`Fuzzy compare: "${a}" == "${b}"`);
                return true;
            }
            else {
                if (this.appSettings.fuzzyMatcher.verbose && allowVerbose)
                    this.loggerService.fuzzy(`Fuzzy compare: "${a}" != "${b}"`);
                return false;
            }
        }
        return false;
    }

    isReady() {
        return this.list !== null && this.list !== undefined && this.list.totalGames > 0;
    }

    isPrepared() {
        let currentTime = new Date().getTime();
        let fuzzyListTimestamps = this.appSettings.fuzzyMatcher.timestamps;

        return !(currentTime - fuzzyListTimestamps.download > this.forcedUpdate || currentTime - fuzzyListTimestamps.check > this.checkInterval);
    }

    listCanBeDownloaded() {
        return !this.appSettings.offlineMode;
    }

    private modifyString(input: string, removeCharacters: boolean, removeBrackets: boolean) {
        if (removeCharacters) {
            input = input.replace(/_/g, ' ');
            input = input.replace(/[^a-zA-Z0-9 \(\)\[\]]/g, '');
        }

        if (removeBrackets)
            input = input.replace(/\(.*?\)|\[.*?\]/g, '');

        if (removeCharacters || removeBrackets) {
            input = input.replace(/\s+/g, ' ').trim();
        }

        return input.trim();
    }

    //If scores are the same, use length diff. to determinate closest match. Also try luck with matching exact titles
    private getBestMatch(pattern: string, matches: Fuzzy.FilterResult<string>[]) {
        let lastSameScoreIndex: number = 0;
        let lengthDiff: number[] = [];
        for (let i = 0; i < matches.length; i++) {
            if (pattern === matches[i].string)
                return matches[i].string;
            else if (matches[lastSameScoreIndex].score === matches[i].score) {
                lastSameScoreIndex = i;
                lengthDiff[i] = Math.abs(matches[i].string.length - pattern.length);
            }
            else
                break;
        }

        if (lastSameScoreIndex === 0)
            return matches[0].string;
        else {
            let minLoopIndex = function (arr: number[]) {
                let len = arr.length, min = Infinity, index = 0;
                while (len--) {
                    if (arr[len] < min) {
                        min = arr[len];
                        index = len;
                    }
                }
                return index;
            };

            return matches[minLoopIndex(lengthDiff)].string;
        }
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
                            reject(new Error('Failed to get fuzzy list count. "totalGames" key is undefined.'));
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
        return new Promise<{ totalGames: number, games: string[] }>((resolve, reject) => {
            this.http.get('http://www.steamgriddb.com/api/games/').timeout(this.timeout).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        resolve(parsedBody);
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
            if (this.list === undefined)
                return readJson(paths.fuzzyList, { totalGames: 0, games: [] });
            else
                return this.list;
        });
    }

    private saveList() {
        return writeJson(paths.fuzzyList, this.list);
    }
}