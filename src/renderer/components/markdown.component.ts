import { Component, ElementRef, Input, SimpleChanges, OnChanges, OnDestroy, DoCheck, ViewEncapsulation } from '@angular/core';
import { DynamicHTMLRenderer, DynamicHTMLRef } from 'ng-dynamic';
import { MarkdownService } from '../services';

@Component({
    selector: 'markdown',
    template: ``,
    styleUrls: ['../styles/markdown.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MarkdownComponent {
    @Input() content: string;
    private ref: DynamicHTMLRef = null;

    constructor(private renderer: DynamicHTMLRenderer, private elementRef: ElementRef, private markdownService: MarkdownService) { }

    ngOnChanges(_: SimpleChanges) {
        if (this.ref) {
            this.ref.destroy();
            this.ref = null;
        }
        if (this.content && this.elementRef) {
            this.ref = this.renderer.renderInnerHTML(this.elementRef, this.markdownService.compile(this.content));
        }
    }

    ngDoCheck() {
        if (this.ref) {
            this.ref.check();
        }
    }

    ngOnDestroy() {
        if (this.ref) {
            this.ref.destroy();
            this.ref = null;
        }
    }
}