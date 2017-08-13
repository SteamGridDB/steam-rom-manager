import { ParsedDataWithFuzzy, FuzzyEventCallback } from "../models";
import * as Fuzzy from "fuzzy";

export class FuzzyMatcher {
    private listAndCache: { totalGames: number, games: string[], cache: { [key: string]: any } };
    private matchFromListMem: (input: string, removeCharacters: boolean, removeBrackets: boolean) => { output: string, matched: boolean };

    constructor(private eventCallback?: FuzzyEventCallback, listAndCache?: { totalGames: number, games: string[], cache: { [key: string]: any } }) {
        this.setEventCallback(eventCallback || ((event: any, data: any) => { }));
        this.setFuzzyListAndCache(listAndCache);
        this.matchFromListMem = require('fast-memoize')(this.matchFromList.bind(this), {
            cache: {
                create: () => {
                    return {
                        has: (key: any) => { return (key in this.listAndCache.cache); },
                        get: (key: any) => { return this.listAndCache.cache[key]; },
                        set: (key: any, value: any) => { this.listAndCache.cache[key] = value; }
                    };
                }
            }
        });
    }

    setEventCallback(eventCallback: FuzzyEventCallback) {
        this.eventCallback = eventCallback;
    }

    setFuzzyListAndCache(listAndCache: { totalGames: number, games: string[], cache: { [key: string]: any } }) {
        this.listAndCache = listAndCache;
    }

    fuzzyMatchParsedData(data: ParsedDataWithFuzzy, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let matches: Fuzzy.FilterResult<string>[] = [];
            for (let i = 0; i < data.success.length; i++) {
                let matchedData = this.matchFromListMem(data.success[i].extractedTitle, removeCharacters, removeBrackets);

                if (matchedData.matched) {
                    data.success[i].fuzzyTitle = matchedData.output;
                    if (verbose)
                        this.eventCallback('info', { info: 'match', stringA: data.success[i].fuzzyTitle, stringB: data.success[i].extractedTitle });
                }
            }
        }
        return data;
    }

    fuzzyMatchString(input: string, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let data = this.matchFromListMem(input, removeCharacters, removeBrackets);
            if (data.matched && verbose)
                this.eventCallback('info', { info: 'match', stringA: data.output, stringB: input });
            return data.output;
        }
        return input;
    }

    fuzzyEqual(a: string, b: string, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let dataA = this.matchFromListMem(a, removeCharacters, removeBrackets);
            let dataB = this.matchFromListMem(b, removeCharacters, removeBrackets);

            if (dataA.output === dataA.output) {
                if (verbose)
                    this.eventCallback('info', { info: 'equal', stringA: a, stringB: b });
                return true;
            }
            else {
                if (verbose)
                    this.eventCallback('info', { info: 'notEqual', stringA: a, stringB: b });
                return false;
            }
        }
        return false;
    }

    isLoaded() {
        return this.listAndCache != null && this.listAndCache.games.length > 0;
    }

    private matchFromList(input: string, removeCharacters: boolean, removeBrackets: boolean) {
        let modifiedInput = this.modifyString(input, removeCharacters, removeBrackets);

        let matches = Fuzzy.filter(modifiedInput, this.listAndCache.games);
        if (matches.length) {
            return { output: this.getBestMatch(modifiedInput, matches), matched: true };
        }
        else {
            let index = input.lastIndexOf(',');
            if (index !== -1) {
                let segments = [input.slice(index + 1), input.slice(0, index)];
                modifiedInput = segments[0][0] === ' ' ? segments.join('') : segments.join(' ');
                modifiedInput = this.modifyString(modifiedInput, removeCharacters, removeBrackets);
                matches = Fuzzy.filter(modifiedInput, this.listAndCache.games);
                if (matches.length) {
                    return { output: this.getBestMatch(modifiedInput, matches), matched: true };
                }
            }
        }
        return { output: input, matched: false };
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
}