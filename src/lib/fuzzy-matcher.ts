import { ParsedDataWithFuzzy, FuzzyEventCallback } from "../models";
import * as Fuzzy from 'fuzzaldrin-plus';

export class FuzzyMatcher {
    private list: { totalGames: number, games: string[] };

    constructor(private eventCallback?: FuzzyEventCallback, list?: { totalGames: number, games: string[] }) {
        this.setEventCallback(eventCallback || ((event: any, data: any) => { }));
        this.setFuzzyList(list);
    }

    setEventCallback(eventCallback: FuzzyEventCallback) {
        this.eventCallback = eventCallback;
    }

    setFuzzyList(list: { totalGames: number, games: string[] }) {
        this.list = list;
    }

    fuzzyMatchParsedData(data: ParsedDataWithFuzzy, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            for (let i = 0; i < data.success.length; i++) {
                let matchedData = this.matchFromList(data.success[i].extractedTitle, removeCharacters, removeBrackets);

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
            let data = this.matchFromList(input, removeCharacters, removeBrackets);
            if (data.matched && verbose)
                this.eventCallback('info', { info: 'match', stringA: data.output, stringB: input });
            return data.output;
        }
        return input;
    }

    fuzzyEqual(a: string, b: string, removeCharacters: boolean, removeBrackets: boolean, verbose: boolean = true) {
        if (this.isLoaded()) {
            let dataA = this.matchFromList(a, removeCharacters, removeBrackets);
            let dataB = this.matchFromList(b, removeCharacters, removeBrackets);

            if (dataA.output === dataB.output) {
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
        return this.list != null && this.list.games.length > 0;
    }

    private matchFromList(input: string, removeCharacters: boolean, removeBrackets: boolean) {
        if (input.length === 0){
            return { output: input, matched: false };
        }
        // Check if title contains ", The..."
        else if (/,\s*the/i.test(input)) {
            let modifiedInput = input.replace(/(.*?),\s*(.*)/i, '$2 $1');
            modifiedInput = this.modifyString(modifiedInput, removeCharacters, removeBrackets);
            let matches = this.performMatching(modifiedInput);
            if (matches.matched)
                return matches;
        }

        let modifiedInput = this.modifyString(input, removeCharacters, removeBrackets);
        return this.performMatching(modifiedInput);
    }

    private performMatching(input: string){
        let matches = Fuzzy.filter(this.list.games, input);
        if (matches.length)
            return { output: this.getBestMatch(input, matches), matched: true };
        else
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

    private getBestMatch(pattern: string, matches: string[]) {
        let bestIndex: number = 0;
        let lengthDiff: number = Infinity;
        let bestScore: number = 0;

        for (let i = 0; i < matches.length; i++) {
            let diff = matches[i].length - pattern.length;
            let absDiff = Math.abs(diff);

            if (absDiff < lengthDiff) {
                bestIndex = i;
                bestScore = Fuzzy.score(matches[i], pattern);
                if (absDiff === 0)
                    break;
                else
                    lengthDiff = absDiff;
            }
            else if (absDiff === lengthDiff && diff < 0) {
                let currentScore = Fuzzy.score(matches[i], pattern);
                if (bestScore <= currentScore) {
                    bestIndex = i;
                    bestScore = currentScore;
                }
            }
        }

        return matches[bestIndex];
    }
}