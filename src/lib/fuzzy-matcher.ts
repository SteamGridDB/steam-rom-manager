import {
  ParsedDataWithFuzzy,
  FuzzyEventCallback,
  FuzzyMatcherOptions,
} from "../models";
import { MemoizedFunction } from "./memoized-function";

const Fuzzy = require("fuzzaldrin-plus");

export class FuzzyMatcher {
  private list: { totalGames: number; games: string[] };
  private latinList: string[];
  private memFn = new MemoizedFunction();

  constructor(
    private eventCallback?: FuzzyEventCallback,
    list?: { totalGames: number; games: string[] },
    cache?: { [key: string]: any },
  ) {
    this.setEventCallback(eventCallback || ((event: any, data: any) => {}));
    this.setFuzzyList(list);
    this.setFuzzyCache(cache);
    this.memFn.memoize(this.matchFromList.bind(this), false);
  }

  setEventCallback(eventCallback: FuzzyEventCallback) {
    this.eventCallback = eventCallback;
  }

  setFuzzyCache(cache: { [key: string]: any }) {
    this.memFn.setCache(cache || {});
  }

  setFuzzyList(list: { totalGames: number; games: string[] }) {
    this.list = list;
    if (this.isLoaded()) {
      this.latinList = new Array(list.games.length);

      for (let i = 0; i < list.games.length; i++) {
        this.latinList[i] = list.games[i].replaceDiacritics();
      }
    }
  }

  fuzzyMatchParsedData(
    data: ParsedDataWithFuzzy,
    options: FuzzyMatcherOptions,
    verbose: boolean = true,
  ) {
    if (this.isLoaded()) {
      for (let i = 0; i < data.success.length; i++) {
        let matchedData = this.memFn.fn(
          data.success[i].extractedTitle,
          options,
        );
        if (matchedData.matched) {
          data.success[i].fuzzyTitle = matchedData.output;
          if (verbose)
            this.eventCallback("info", {
              info: "match",
              stringA: data.success[i].fuzzyTitle,
              stringB: data.success[i].extractedTitle,
            });
        }
      }
    }
    return data;
  }

  fuzzyMatchString(
    input: string,
    options: FuzzyMatcherOptions,
    verbose: boolean = true,
  ) {
    if (this.isLoaded()) {
      let data = this.memFn.fn(input, options);
      if (data.matched && verbose)
        this.eventCallback("info", {
          info: "match",
          stringA: data.output,
          stringB: input,
        });
      return data.output;
    }
    return input;
  }

  fuzzyEqual(
    a: string,
    b: string,
    options: FuzzyMatcherOptions,
    verbose: boolean = true,
  ) {
    if (this.isLoaded()) {
      let dataA = this.memFn.fn(a, options);
      let dataB = this.memFn.fn(b, options);

      if (dataA.output === dataB.output) {
        if (verbose)
          this.eventCallback("info", { info: "equal", stringA: a, stringB: b });
        return true;
      } else {
        if (verbose)
          this.eventCallback("info", {
            info: "notEqual",
            stringA: a,
            stringB: b,
          });
        return false;
      }
    }
    return false;
  }

  isLoaded() {
    return this.list != null && this.list.games.length > 0;
  }

  private matchFromList(input: string, options: FuzzyMatcherOptions) {
    if (input.length === 0) {
      return { output: input, matched: false };
    }
    // Check if title contains ", The..."
    else if (/,\s*the/i.test(input)) {
      // Move "The" to the front
      let modifiedInput = input.replace(/(.*?),\s*(the)/i, "$2 $1");
      modifiedInput = this.modifyString(modifiedInput, options);
      let matches = this.performMatching(
        modifiedInput,
        options.replaceDiacritics,
      );
      if (matches.matched) return matches;

      // Move "The + everything else" to the front
      modifiedInput = input.replace(/(.*?),\s*(the.*)/i, "$2 $1");
      modifiedInput = this.modifyString(modifiedInput, options);
      matches = this.performMatching(modifiedInput, options.replaceDiacritics);
      if (matches.matched) return matches;
    }

    let modifiedInput = this.modifyString(input, options);
    return this.performMatching(modifiedInput, options.replaceDiacritics);
  }

  private performMatching(input: string, diacriticsRemoved: boolean) {
    const list = diacriticsRemoved ? this.latinList : this.list.games;
    const preparedQuery = Fuzzy.prepareQuery(input, { usePathScoring: false });
    let bestScore = 0;
    let matches: string[] = [];

    for (let i = 0; i < list.length; i++) {
      let score = Fuzzy.score(list[i], preparedQuery.query, {
        preparedQuery,
        usePathScoring: false,
      });
      if (score >= bestScore && score !== 0) {
        bestScore = score;
        matches.push(this.list.games[i]);
      }
    }
    if (matches.length) {
      const bestMatch = matches[matches.length - 1];
      return { output: bestMatch, matched: true };
    }
    return { output: input, matched: false };
  }

  private modifyString(input: string, options: FuzzyMatcherOptions) {
    if (options.replaceDiacritics) {
      input = input.replaceDiacritics();
    }

    if (options.removeCharacters) {
      input = input.replace(/_/g, " ");
      input = input.replace(/[^a-zA-Z0-9 \(\)\[\]]/g, "");
    }

    if (options.removeBrackets) input = input.replace(/\(.*?\)|\[.*?\]/g, "");

    if (options.removeCharacters || options.removeBrackets) {
      input = input.replace(/\s+/g, " ").trim();
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
        if (absDiff === 0) break;
        else lengthDiff = absDiff;
      } else if (absDiff === lengthDiff && diff < 0) {
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
