import { Pipe, PipeTransform } from "@angular/core";
import fuzzysort from 'fuzzysort';

@Pipe({ name: "fuzzyTest" })
export class FuzzyTestPipe implements PipeTransform {
  transform(inputString: string, query: string) {
    if(query) {
      const res = fuzzysort.single(query, inputString);
      const score = res ? res.score : 0;
      return score > .5;
    }
    return true;
  }
}
