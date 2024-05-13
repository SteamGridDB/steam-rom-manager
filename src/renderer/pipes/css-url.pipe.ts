import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'cssUrl' })
export class CssUrl implements PipeTransform {
    transform(filePath: string) {
        return `url("${filePath}")`;
    }
}