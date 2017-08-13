import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'fileUrl' })
export class FileUrl {
    transform(filePath: string) {
        return encodeURI(`file:///${filePath.replace(/\\/g, '/')}`);
    }
}