import { Pipe, PipeTransform } from '@angular/core';
import * as Fuzzy from 'fuzzaldrin-plus';

@Pipe({ name: 'fuzzyTest' })
export class FuzzyTestPipe implements PipeTransform {
    transform(inputString: string, query: string) {
        return query.length > 0 ? Fuzzy.score(inputString, query) !== 0 : true;
    }
}