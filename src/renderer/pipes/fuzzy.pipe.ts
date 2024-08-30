import { Pipe, PipeTransform } from "@angular/core";
const Fuzzy = require("fuzzaldrin-plus");

@Pipe({ name: "fuzzyTest" })
export class FuzzyTestPipe implements PipeTransform {
  transform(inputString: string, query: string) {
    return query.length > 0
      ? Fuzzy.score(inputString, query, { usePathScoring: false }) !== 0
      : true;
  }
}
