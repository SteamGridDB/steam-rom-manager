import {
  Component,
  forwardRef,
  ElementRef,
  Optional,
  Host,
  HostListener,
  Input,
  Output,
  ContentChildren,
  QueryList,
  ChangeDetectorRef,
  ViewChild,
  Renderer2,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import * as _ from "lodash";
import * as rangy from "rangy";

const removeAt = (arr: any[], index: number) =>
  arr.slice(0, index).concat(arr.slice(index + 1));

@Component({
  selector: "ng-bubbles",
  template: `
    <div class="bubblesContainer">
      <ng-container *ngFor="let item of items; let i = index">
        <div class="bubble">
          <span>{{ item }}</span>
          <svg
            [hover]="true"
            xdelete
            class="delete"
            (click)="removeItem(i)"
          ></svg>
        </div>
      </ng-container>
      <div *ngIf="addable" class="bubble addable" (click)="makeLiveItem()">
        <span *ngIf="!typingState">+</span>
        <div
          *ngIf="typingState"
          #inputEl
          contenteditable="true"
          spellcheck="false"
          (input)="handleInput($event.target, inputEl)"
          (keydown)="handleKeypress($event)"
          (blur)="handleBlur()"
          class="editable"
        ></div>
      </div>
    </div>
  `,
  styleUrls: ["../styles/ng-bubbles.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgBubblesComponent),
      multi: true,
    },
  ],
})
export class NgBubblesComponent implements ControlValueAccessor {
  private onChange = (_: any) => {};
  private onTouched = () => {};
  typingState = false;
  addableValue: string = "";
  items: string[] = [];
  @Input() set bubbleItems(value: string[]) {
    this.writeValue(value);
  }
  @Input() addable: boolean;
  @ViewChild("input") private elementRef: ElementRef;
  constructor(
    private element: ElementRef,
    private changeRef: ChangeDetectorRef,
    private renderer: Renderer2,
  ) {}

  get value() {
    return this.items;
  }

  makeLiveItem() {
    if (!this.typingState) {
      this.typingState = true;
      setTimeout(function () {
        const inputEl = document.querySelector(
          ".editable",
        ) as HTMLTextAreaElement;
        inputEl.focus();
      }, 100);
    }
  }

  handleInput(target: EventTarget, inputEl: HTMLDivElement) {
    const newValue = (target as HTMLTextAreaElement).textContent;
    if (this.addableValue != newValue) {
      this.addableValue = newValue;
      this.setInnerHtml(inputEl, newValue);
      this.changeRef.markForCheck();
    }
  }

  private transferBubble() {
    if (this.addableValue) {
      this.addItem(this.addableValue);
    }
    this.addableValue = "";
    this.typingState = false;
  }
  handleKeypress(event: KeyboardEvent) {
    if (
      event.key === "Enter" ||
      (event.key === "Backspace" && this.addableValue == "")
    ) {
      event.preventDefault();
      this.transferBubble();
    }
  }
  handleBlur() {
    this.transferBubble();
  }

  addItem(item: string) {
    this.items.push(item);
    this.onChange(this.items);
    this.onTouched();
  }
  removeItem(index: number) {
    this.items = removeAt(this.items, index);
    this.onChange(this.items);
    this.onTouched();
  }

  writeValue(value: string[]) {
    this.items = value;
    this.onChange(this.items);
    this.changeRef.detectChanges();
    this.onTouched();
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }

  private setInnerHtml(
    element: Element,
    data: string,
    selection?: { start: number; end: number },
  ) {
    if (data && data.length) {
      selection =
        selection ||
        (document.activeElement === element && data.length > 0
          ? this.saveSelection(element)
          : null);
      this.renderer.setProperty(element, "innerHTML", data);

      if (selection) {
        this.restoreSelection(element, selection);
      }
    } else {
      this.renderer.setProperty(element, "innerHTML", null);
    }
  }

  //from https://stackoverflow.com/questions/5595956/replace-innerhtml-in-contenteditable-div/5596688#5596688
  private saveSelection(containerEl: Element) {
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
    };

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

  private restoreSelection(
    containerEl: Element,
    savedSel: { start: number; end: number },
  ) {
    let charIndex = 0;
    let foundStart = false;
    let stop = {};
    let range = rangy.createRange();

    range.collapseToPoint(containerEl, 0);

    let traverseTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        var nextCharIndex = charIndex + (node as Text).length;
        if (
          !foundStart &&
          savedSel.start >= charIndex &&
          savedSel.start <= nextCharIndex
        ) {
          range.setStart(node, savedSel.start - charIndex);
          foundStart = true;
        }
        if (
          foundStart &&
          savedSel.end >= charIndex &&
          savedSel.end <= nextCharIndex
        ) {
          range.setEnd(node, savedSel.end - charIndex);
          throw stop;
        }
        charIndex = nextCharIndex;
      } else {
        for (let i = 0; i < node.childNodes.length; ++i) {
          traverseTextNodes(node.childNodes[i]);
        }
      }
    };

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
}
