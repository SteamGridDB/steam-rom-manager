import {
  ParsedDataWithFuzzy,
  FuzzyEventCallback,
  FuzzyMatcherOptions,
  MatchResult,
} from "../models";
import { MemoizedFunction } from "./memoized-function";
import fuzzysort from "fuzzysort";
import * as _ from "lodash";

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
    //"Return of the King, The" => "The Return of the King"
    //"The King, The Return of" =>  "The Return of The King"
    //"Harold & Maude" => "Harold and Maude"
    //"Harold and Maude" => "Harold & Maude"
    //"Bob" => "Bob"
    const manualModifications = _.uniq(
      [
        /,\s*the/i.test(input)
          ? input.replace(/(.*?),\s*(the)/i, "$2 $1")
          : null,
        /,\s*the/i.test(input)
          ? input.replace(/(.*?),\s*(the.*)/i, "$2 $1")
          : null,
        input.replaceAll(/\sand\s/gi, " & "),
        input.replaceAll(/\s&\s/g, " and "),
        input,
      ].filter((x) => !!x),
    );
    let matches;
    for (const modifiedInput of manualModifications) {
      const cleanString = this.modifyString(modifiedInput, options);
      matches = this.performMatching(cleanString, options.replaceDiacritics);
      if (matches.matched) return matches;
    }
    return matches;
  }

  private performMatching(
    input: string,
    diacriticsRemoved: boolean,
  ): MatchResult {
    const list = diacriticsRemoved ? this.latinList : this.list.games;
    const res = fuzzysort.go(input, list, { threshold: 0.5 });
    if (res.length) {
      return { output: res[0].target, matched: true };
    } else {
      return { output: input, matched: false };
    }
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
}
