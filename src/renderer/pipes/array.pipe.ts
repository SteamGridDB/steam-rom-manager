import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "arrayConcat" })
export class ArrayConcatPipe implements PipeTransform {
  transform(value: any[], newValue: any | any[]) {
    return value.concat(newValue);
  }
}

@Pipe({ name: "rangeArray" })
export class RangeArrayPipe implements PipeTransform {
  transform(value: { start: number; end: number }) {
    let result = [];
    for (let i = value.start; i < value.end; i++) {
      result.push(i);
    }
    return result;
  }
}
