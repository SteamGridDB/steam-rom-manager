import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHtml implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html: string) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

@Pipe({ name: 'safeStyle' })
export class SafeStyle implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(style: string) {
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
}

@Pipe({ name: 'safeResourceUrl' })
export class SafeResourceUrl implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(resourceUrl: string) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(resourceUrl);
    }
}