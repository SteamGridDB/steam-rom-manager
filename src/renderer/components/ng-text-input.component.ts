import { Component, forwardRef, Input, ChangeDetectorRef, Renderer2, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as rangy from 'rangy';
import * as he from 'he';
import * as path from 'path';
import { escape } from 'glob';

@Component({
  selector: 'ng-text-input',
  template: `<div class="contents"
                    #input
                    [attr.data-placeholder]="placeholder"
                    contenteditable="true"
                    spellcheck="false"
                    (input)="this.writeValue($event.target.textContent, true)"
                    (keypress)="handleKeypress($event)"
                    (drag)="handleDragAndDrop($event)"
                    (dragover)="handleDragAndDrop($event)"
                    (paste)="handlePaste($event)">{{currentValue}}
                </div>`,
  styleUrls: [
    '../styles/ng-text-input.component.scss'
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgTextInputComponent),
    multi: true
  }],
  host: {
    '[class.multiline]': 'multiline'
  }
})
export class NgTextInputComponent implements ControlValueAccessor {
  private currentValue: string = null;
  @ViewChild("input") private elementRef: ElementRef;
  @Input() private placeholder: string = null;
  @Input() private appendGlob: string = null;
  @Input() private highlight: (input: string, tag: string) => string = null;
  @Input() private highlightTag: string = null;
  @Input() private multiline: boolean = false;
  @Input() private dragAndDrop: boolean = false;
  private onChange = (_: any) => { };
  private onTouched = () => { };

  private handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    let data = event.clipboardData.getData('text');
    if (!this.multiline)
      data = data.replace(/\r?\n|\r/g, '');

    if (data) {
      if (this.currentValue && this.currentValue.length > 0) {
        let selection = this.saveSelection(this.elementRef.nativeElement);
        let newSelection = selection.start + data.length;
        this.writeValue(`${this.currentValue.substring(0, selection.start)}${data}${this.currentValue.substring(selection.end)}`, true, { start: newSelection, end: newSelection });
      }
      else {
        this.writeValue(data, true, { start: data.length, end: data.length });
      }
    }
  }

  private handleKeypress(event: KeyboardEvent) {
    if (!this.multiline && event.key === 'Enter')
      event.preventDefault();
  }

  private handleDragAndDrop(event: Event) {
    if (!this.dragAndDrop)
      event.preventDefault();
  }

  private setInnerHtml(data: string, selection?: { start: number, end: number }) {
    if (this.elementRef && this.elementRef.nativeElement) {
      if (data && data.length) {
        selection = selection || (document.activeElement === this.elementRef.nativeElement && data.length > 0 ? this.saveSelection(this.elementRef.nativeElement) : null);

        if (this.highlight) {
          data = this.highlight(data, this.highlightTag || 'highlight');
        }
        data = he.encode(data);
        if (this.highlight) {
          data = data.replace(new RegExp(`&#x3C;.*?${this.highlightTag || 'highlight'}.*?&#x3E;`, 'g'), (match: string) => {
            return he.decode(match);
          });
        }

        this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', data);

        if (selection) {
          this.restoreSelection(this.elementRef.nativeElement, selection);
        }
      }
      else {
        this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', null);
      }
    }
  }

  //from https://stackoverflow.com/questions/5595956/replace-innerhtml-in-contenteditable-div/5596688#5596688
  private saveSelection(containerEl: HTMLElement) {
    let charIndex = 0;
    let start = 0;
    let end = 0;
    let foundStart = false;
    let stop = {};
    let sel = rangy.getSelection();

    let traverseTextNodes = (node: Node, range: Range) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!foundStart && node === range.startContainer) {
          start = charIndex + range.startOffset;
          foundStart = true;
        }
        if (foundStart && node === range.endContainer) {
          end = charIndex + range.endOffset;
          throw stop;
        }
        charIndex += (node as Text).length;
      } else {
        for (let i = 0; i < node.childNodes.length; ++i) {
          traverseTextNodes(node.childNodes[i], range);
        }
      }
    }

    if (sel.rangeCount) {
      try {
        traverseTextNodes(containerEl, sel.getRangeAt(0));
      } catch (ex) {
        if (ex !== stop) {
          throw ex;
        }
      }
    }

    return { start: start, end: end };
  }

  private restoreSelection(containerEl: HTMLElement, savedSel: { start: number, end: number }) {
    let charIndex = 0;
    let foundStart = false;
    let stop = {};
    let range = rangy.createRange()

    range.collapseToPoint(containerEl, 0);

    let traverseTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        var nextCharIndex = charIndex + (node as Text).length;
        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
          range.setEnd(node, savedSel.end - charIndex);
          throw stop;
        }
        charIndex = nextCharIndex;
      } else {
        for (let i = 0; i < node.childNodes.length; ++i) {
          traverseTextNodes(node.childNodes[i]);
        }
      }
    }

    try {
      traverseTextNodes(containerEl);
    } catch (ex) {
      if (ex === stop) {
        rangy.getSelection().setSingleRange(range);
      } else {
        throw ex;
      }
    }
  }

  constructor(private changeRef: ChangeDetectorRef, private renderer: Renderer2) { }

  writeValue(value: string, updateDom: boolean = true, selection?: { start: number, end: number }): void {
    let previousValue = this.currentValue;
    if (value !== this.currentValue) {
      if(value && value.split('&:&')[0]=='_browse_'){
        const selectedPath = value.split('&:&')[1]
        if(this.appendGlob) {
          const swapString = '$:$:$'
          const t1 = escape(selectedPath.replaceAll('\\','/'));
          const t2 = t1.replaceAll('\\', swapString)
          const t3 = path.resolve(t2, this.currentValue ? path.basename(this.currentValue) : this.appendGlob)
          value = t3.replaceAll('\\','/').replaceAll(swapString,'\\');
        } else {
          value = selectedPath;
        }
      }
      this.currentValue = value;
      if (updateDom || this.highlight)
        this.setInnerHtml(value, selection);
      this.onChange(this.currentValue);
      this.changeRef.markForCheck();
    }

    this.onTouched();
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }

  ngAfterViewInit() {
    // Had to do this to get the placeholder to appear in certain exceptions/logger
    this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', this.currentValue || null);
  }
}
