import { PipeTransform, Pipe } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

// Wraps the first case-insensitive occurrence of `term` within `text` in a
// <mark> tag so it can be rendered via [innerHTML]. The input text is escaped
// first so parser titles are always treated as plain text.
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
    const safeText = this.escape(text);
    const needle = (term || "").trim();
    if (!needle) {
      return this.sanitizer.bypassSecurityTrustHtml(safeText);
    }
    const lowerText = (text || "").toLowerCase();
    const index = lowerText.indexOf(needle.toLowerCase());
    if (index === -1) {
      return this.sanitizer.bypassSecurityTrustHtml(safeText);
    }
    const before = this.escape((text || "").slice(0, index));
    const match = this.escape((text || "").slice(index, index + needle.length));
    const after = this.escape((text || "").slice(index + needle.length));
    return this.sanitizer.bypassSecurityTrustHtml(
      `${before}<mark>${match}</mark>${after}`,
    );
  }
}
