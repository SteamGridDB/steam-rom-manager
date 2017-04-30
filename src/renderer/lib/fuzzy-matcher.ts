import { Http } from '@angular/http';
import { LoggerService } from "./../services";
import { FuzzyListTimestamps, ParsedData, ParsedDataWithFuzzy } from "../models";
import * as paths from "../../shared/paths";
import * as Fuzzy from "fuzzy";
import * as fs from 'fs-extra';

export class FuzzyMatcher {
    private list: string[];
    private fuzzyListTimestamps: FuzzyListTimestamps;
    private checkInterval: number = 43200000; //every 12 h
    private forcedUpdate: number = 604800000; //every week
    private timeout: number = 120000; //timeout

    constructor(private http: Http, private loggerService: LoggerService) { }

    prepareIfNeeded() {
        return this.readSettingsFile().then((fuzzyListTimestamps) => {
            this.fuzzyListTimestamps = fuzzyListTimestamps;
            return this.readList();
        }).then((list) => {
            this.list = list;
            let currentTime = new Date().getTime();
            if (currentTime - this.fuzzyListTimestamps.download > this.forcedUpdate || this.list.length === 0) {
                this.loggerService.info('Title list download for fuzzy matching started.');
                return this.downloadList().then((list) => {
                    this.list = list;
                    this.fuzzyListTimestamps.download = currentTime;
                    this.fuzzyListTimestamps.check = currentTime;
                    this.loggerService.info('Download was successful. Saving list.');
                    return this.saveList().then(() => this.updateSettingsFile());
                });
            }
            else if (currentTime - this.fuzzyListTimestamps.check > this.checkInterval) {
                this.loggerService.info('Checking if title list is up to date.');
                return this.getTotalCount().then((countInDatabase) => {
                    if (this.list.length !== countInDatabase) {
                        this.loggerService.info('List is outdated. Title list download for fuzzy matching started.');
                        return this.downloadList().then((list) => {
                            this.list = list;
                            this.fuzzyListTimestamps.download = currentTime;
                            this.fuzzyListTimestamps.check = currentTime;
                            this.loggerService.info('Download was successful. Saving list.');
                            return this.saveList().then(() => this.updateSettingsFile());
                        });
                    }
                    else {
                        this.loggerService.info('Title list is up to date.');
                        this.fuzzyListTimestamps.check = currentTime;
                        return this.updateSettingsFile();
                    }
                });
            }
        }).catch((error) => {
            this.loggerService.error('Error occured while preparing "Fuzzy matcher". Fuzzy matching will be skipped.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
        });
    }

    fuzzyMatch(data: ParsedDataWithFuzzy) {
        let matches: Fuzzy.FilterResult<string>[] = [];
        for (let i = 0; i < data.success.length; i++) {
            matches = Fuzzy.filter(data.success[i].extractedTitle, this.list);
            if (matches.length) {
                data.success[i].fuzzyTitle = this.getBestMatch(data.success[i].extractedTitle, matches);
                this.loggerService.info(`Fuzzy title "${data.success[i].fuzzyTitle}" from "${data.success[i].extractedTitle}"`);
            }
        }
        return data;
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
            let minLoop = function (arr: number[]) {
                let len = arr.length, min = Infinity;
                while (len--) {
                    if (arr[len] < min) {
                        min = arr[len];
                    }
                }
                return min;
            };

            return matches[minLoop(lengthDiff)].string;
        }
    }

    private getTotalCount() {
        return new Promise<number>((resolve, reject) => {
            this.http.get('http://www.steamgriddb.com/api/games/info/').timeout(this.timeout).subscribe(
                (response) => {
                    try {
                        let parsedBody = response.json();
                        if (parsedBody['total'] !== undefined)
                            resolve(parseInt(parsedBody['total']));
                        else
                            reject(new Error('Failed to get fuzzy list count. "total" key is undefined.'));
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
        return new Promise<string[]>((resolve, reject) => {
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
        return new Promise<string[]>((resolve, reject) => {
            if (this.list === undefined) {
                fs.readFile(paths.fuzzyList, 'utf8', (error, data) => {
                    try {
                        if (error) {
                            if (error.code === 'ENOENT')
                                resolve([]);
                            else
                                reject(error);
                        }
                        else {
                            resolve(JSON.parse(data));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            else {
                resolve(this.list);
            }
        });
    }

    private saveList() {
        return new Promise<void>((resolve, reject) => {
            fs.outputFile(paths.fuzzyList, JSON.stringify(this.list, null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    private readSettingsFile() {
        return new Promise<FuzzyListTimestamps>((resolve, reject) => {
            if (this.fuzzyListTimestamps === undefined) {
                fs.readFile(paths.userSettings, 'utf8', (error, data) => {
                    try {
                        if (error) {
                            if (error.code === 'ENOENT')
                                resolve(<FuzzyListTimestamps>{ check: 0, download: 0 });
                            else
                                reject(error);
                        }
                        else {
                            let fuzzyListTimestamps = <FuzzyListTimestamps>JSON.parse(data)['fuzzyListTimestamps'];
                            resolve(<FuzzyListTimestamps>{ check: fuzzyListTimestamps.check || 0, download: fuzzyListTimestamps.download || 0 });
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            else {
                resolve(this.fuzzyListTimestamps);
            }
        });
    }

    private updateSettingsFile() {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(paths.userSettings, 'utf8', (error, data) => {
                try {
                    if (error) {
                        if (error.code !== 'ENOENT')
                            return reject(error);
                    }

                    let settingsData = {};
                    if (data)
                        settingsData = <FuzzyListTimestamps>JSON.parse(data);

                    settingsData['fuzzyListTimestamps'] = this.fuzzyListTimestamps;
                    fs.outputFile(paths.userSettings, JSON.stringify(settingsData, null, 4), (error) => {
                        if (error)
                            reject(error);
                        else
                            resolve();
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}