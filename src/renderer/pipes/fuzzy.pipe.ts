import { Pipe, PipeTransform } from '@angular/core';
import * as Fuzzy from "fuzzy";

@Pipe({ name: 'fuzzyTest' })
export class FuzzyTestPipe implements PipeTransform {
    transform(inputString: string, patter: string) {
        return Fuzzy.test(patter, inputString);
    }
}