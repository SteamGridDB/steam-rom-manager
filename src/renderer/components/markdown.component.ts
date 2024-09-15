import {
  Component,
  ElementRef,
  Input,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
  Renderer2,
} from "@angular/core";
import { MarkdownService } from "../services";

@Component({
  selector: "markdown",
  template: ``,
  styleUrls: ["../styles/markdown.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class MarkdownComponent {
  @Input() content: string;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private markdownService: MarkdownService,
  ) {}

  ngOnChanges(_: SimpleChanges) {
    if (this.content && this.elementRef) {
      this.renderer.setProperty(
        this.elementRef.nativeElement,
        "innerHTML",
        this.markdownService.compile(this.content),
      );
    }
  }
}
