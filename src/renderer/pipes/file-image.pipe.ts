import { PipeTransform, Pipe } from '@angular/core';
import { url } from '../../lib';

@Pipe({ name: 'fileImage' })
export class FileImage {
    transform(filePath: string) {
        return url.encodeFile(filePath);
    }
}