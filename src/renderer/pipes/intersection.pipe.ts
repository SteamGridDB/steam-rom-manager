import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'intersectionTest' })
export class IntersectionTestPipe implements PipeTransform {
  transform(inputStringList: string[], queryList: string[]) {
    return (queryList||[]).length > 0 ? _.intersection(inputStringList, queryList).length !== 0 : true;
  }
}
