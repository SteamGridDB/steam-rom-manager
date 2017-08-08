import { ParsedDataWithFuzzy, FuzzyEventCallback } from "../models";
import * as Fuzzy from "fuzzy";

export class FuzzyMatcher {
    private list: string[];

    constructor(private eventCallback?: FuzzyEventCallback, list?: string[]) {
        this.setEventCallback(eventCallback || ((event: any, data: any) => { }));
        this.setFuzzyList(list || []);
    }

    setEventCallback(eventCallback: FuzzyEventCallback) {
        this.eventCallback = eventCallback;
    }

    setFuzzyList(list: string[]) {
        this.list = list;
    }

    fuzzyMatchParsedData(data: ParsedDataWithFuzzy, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let matches: Fuzzy.FilterResult<string>[] = [];
            for (let i = 0; i < data.success.length; i++) {
                let extractedTitle = this.modifyString(data.success[i].extractedTitle, removeCharacters, removeBrackets);

                matches = Fuzzy.filter(extractedTitle, this.list);
                if (matches.length) {
                    data.success[i].fuzzyTitle = this.getBestMatch(extractedTitle, matches);
                    if (verbose)
                        this.eventCallback('info', { info: 'match', stringA: data.success[i].fuzzyTitle, stringB: data.success[i].extractedTitle });
                }
            }
        }
        return data;
    }

    fuzzyMatchString(input: string, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let extractedTitle = this.modifyString(input, removeCharacters, removeBrackets);

            let matches = Fuzzy.filter(extractedTitle, this.list);
            if (matches.length) {
                let bestMatch = this.getBestMatch(extractedTitle, matches);
                if (verbose)
                    this.eventCallback('info', { info: 'match', stringA: bestMatch, stringB: extractedTitle });
                return bestMatch;
            }
        }
        return input;
    }

    fuzzyEqual(a: string, b: string, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            if (this.fuzzyMatchString(a, removeCharacters, removeBrackets, false) === this.fuzzyMatchString(b, removeCharacters, removeBrackets, false)) {
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
        return this.list !== null && this.list !== undefined && this.list.length > 0;
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