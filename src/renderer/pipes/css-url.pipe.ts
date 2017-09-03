import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'cssUrl' })
export class CssUrl {
    transform(filePath: string) {
        return `url("${filePath}")`;
    }
}