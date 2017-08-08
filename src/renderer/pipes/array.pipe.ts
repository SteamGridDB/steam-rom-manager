import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'arrayConcat' })
export class ArrayConcatPipe implements PipeTransform {
    transform(value: any[], newValue: any | any[]) {
        return value.concat(newValue);
    }
}