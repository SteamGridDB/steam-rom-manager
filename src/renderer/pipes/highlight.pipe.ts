import { PipeTransform, Pipe } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

// Wraps every case-insensitive occurrence of `term` within `text` in a <mark>
// tag so it can be rendered via [innerHTML]. The input text is escaped first so
// values are always treated as plain text.
@Pipe({ name: "highlight" })
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  private escape(input: string): string {
    return (input || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  transform(text: string, term: string): SafeHtml {
    const source = text || "";
    const needle = (term || "").trim();
    if (!needle) {
      return this.sanitizer.bypassSecurityTrustHtml(this.escape(source));
    }
    const lowerText = source.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let result = "";
    let cursor = 0;
    let index = lowerText.indexOf(lowerNeedle, cursor);
    while (index !== -1) {
      result +=
        this.escape(source.slice(cursor, index)) +
        "<mark>" +
        this.escape(source.slice(index, index + needle.length)) +
        "</mark>";
      cursor = index + needle.length;
      index = lowerText.indexOf(lowerNeedle, cursor);
    }
    result += this.escape(source.slice(cursor));
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}
