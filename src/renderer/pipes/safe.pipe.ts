import { PipeTransform, Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

// null passes through (e.g. no background image yet: leaves the style unset).

@Pipe({ name: "safeHtml" })
export class SafeHtml implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string | null) {
    return html == null ? null : this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

@Pipe({ name: "safeStyle" })
export class SafeStyle implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(style: string | null) {
    return style == null
      ? null
      : this.sanitizer.bypassSecurityTrustStyle(style);
  }
}

@Pipe({ name: "safeResourceUrl" })
export class SafeResourceUrl implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(resourceUrl: string | null) {
    return resourceUrl == null
      ? null
      : this.sanitizer.bypassSecurityTrustResourceUrl(resourceUrl);
  }
}
