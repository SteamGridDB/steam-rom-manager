import { PipeTransform, Pipe } from "@angular/core";

@Pipe({ name: "keys" })
export class KeysPipe implements PipeTransform {
  transform(value: any) {
    let keys = [];
    for (let key in value) keys.push(key);
    return keys;
  }
}

@Pipe({ name: "key" })
export class KeyPipe implements PipeTransform {
  transform(value: any, index: number) {
    return Object.keys(value)[index];
  }
}
