import { Pipe, PipeTransform } from '@angular/core';
import * as Fuzzy from "fuzzy";

@Pipe({ name: 'fuzzyTest' })
export class FuzzyTestPipe implements PipeTransform {
    transform(inputString: string, pattern: string) {
        return pattern.length > 0 ? Fuzzy.test(pattern, inputString) : true;
    }
}