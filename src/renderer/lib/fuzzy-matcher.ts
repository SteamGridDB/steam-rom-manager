import { ParsedDataWithFuzzy, FuzzyEventCallback } from "../models";
import * as Fuzzy from 'fuzzaldrin-plus';

export class FuzzyMatcher {
    private list: { totalGames: number, games: string[] };
    private matchFromListMem: (input: string, removeCharacters: boolean, removeBrackets: boolean) => { output: string, matched: boolean };

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
        return this.list != null && this.list.games.length > 0;
    }

    private matchFromList(input: string, removeCharacters: boolean, removeBrackets: boolean) {
        let modifiedInput = this.modifyString(input, removeCharacters, removeBrackets);

        let matches = Fuzzy.filter(this.list.games, modifiedInput);
        if (matches.length) {
            return { output: matches[0], matched: true };
        }
        else {
            let index = input.lastIndexOf(',');
            if (index !== -1) {
                let segments = [input.slice(index + 1), input.slice(0, index)];
                modifiedInput = segments[0][0] === ' ' ? segments.join('') : segments.join(' ');
                modifiedInput = this.modifyString(modifiedInput, removeCharacters, removeBrackets);
                matches = Fuzzy.filter(this.list.games, modifiedInput);
                if (matches.length) {
                    return { output: matches[0], matched: true };
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
}