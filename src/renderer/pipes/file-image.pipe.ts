import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'fileImage' })
export class FileImage {
    transform(filePath: string) {
        return encodeURI(`file:///${filePath.replace(/\\/g, '/')}`);
    }
}