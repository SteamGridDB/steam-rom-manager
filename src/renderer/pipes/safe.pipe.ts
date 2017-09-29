import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHtml {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html: string) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

@Pipe({ name: 'safeStyle' })
export class SafeStyle {
    constructor(private sanitizer: DomSanitizer) { }

    transform(style: string) {
        return this.sanitizer.bypassSecurityTrustStyle(style);
    }
}

@Pipe({ name: 'safeResourceUrl' })
export class SafeResourceUrl {
    constructor(private sanitizer: DomSanitizer) { }

    transform(resourceUrl: string) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(resourceUrl);
    }
}