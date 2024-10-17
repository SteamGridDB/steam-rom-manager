import {
  Component,
  forwardRef,
  Input,
  ChangeDetectorRef,
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
          <div (click)="makeLiveItem(i)">
            <span *ngIf="!editing[i]">{{ item }}</span>
            <div
              *ngIf="addable && editing[i]"
              contenteditable="true"
              spellcheck="false"
              (input)="handleChangeInput($event.target, i)"
              (keydown)="handleChangeKeypress($event, i)"
              (blur)="handleChangeBlur(i)"
              class="editable"
            ></div>
          </div>
          <svg
            [hover]="true"
            xdelete
            class="delete"
            (click)="removeItem(i)"
          ></svg>
        </div>
      </ng-container>
      <div *ngIf="addable" class="bubble addable" (click)="addLiveItem()">
        <span *ngIf="!editingNew">+</span>
        <div
          *ngIf="editingNew"
          contenteditable="true"
          spellcheck="false"
          (input)="handleInput($event.target)"
          (keydown)="handleKeypress($event)"
          (blur)="handleBlur()"
          class="editablePlus"
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
  editingNew = false;
  editing: boolean[] = [];
  addables: string[] = [];
  addableValue: string = "";
  items: string[] = [];
  @Input() set bubbleItems(value: string[]) {
    this.writeValue(value);
  }
  @Input() addable: boolean;

  constructor(
    private changeRef: ChangeDetectorRef,
    private renderer: Renderer2,
  ) {}

  get value() {
    return this.items;
  }

  makeLiveItem(index: number) {
    if (this.addable && !this.editing[index]) {
      this.editing[index] = true;
      this.addables[index] = this.items[index];
      const self=this;
      setTimeout(()=> {
        const inputEl = document.querySelector(".editable") as HTMLTextAreaElement;
        const len = self.addables[index].length
        self.setInnerHtml(inputEl,self.addables[index], {start: len, end: len})
        inputEl.focus();
      }, 100)
    }
  }

  addLiveItem() {
    if (!this.editingNew) {
      this.editingNew = true;
      setTimeout(() => {
        const inputEl = document.querySelector(
          ".editablePlus",
        ) as HTMLTextAreaElement;
        inputEl.focus();
      }, 100);
    }
  }
  handleChangeInput(target: EventTarget, index: number) {
    const newValue = (target as HTMLTextAreaElement).textContent;
    if (this.addables[index] != newValue) {
      this.addables[index] = newValue;
      this.changeRef.detectChanges();
    }
  }

  private transferChangeBubble(index: number) {
    if(this.addables[index]) {
      this.changeItem(this.addables[index], index)
      this.addables[index]="";
      this.editing[index]=false;
    } else {
      this.removeItem(index);
    }
    this.changeRef.detectChanges();
  }

  handleChangeKeypress(event: KeyboardEvent, index: number) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
      this.transferChangeBubble(index);
      if(index == this.items.length - 1) {
        this.addLiveItem();
      }
    }
    else if (event.key === "Backspace" && this.addables[index] == "") {
      event.preventDefault();
      this.transferChangeBubble(index);
      this.makeLiveItem(index-1);
    }
  }

  handleChangeBlur(index: number) {
    this.transferChangeBubble(index);
  }

  handleInput(target: EventTarget) {
    const newValue = (target as HTMLTextAreaElement).textContent;
    if (this.addableValue != newValue) {
      this.addableValue = newValue;
    }
  }

  private transferBubble() {
    if (this.addableValue) {
      this.addItem(this.addableValue);
    }
    this.addableValue = "";
    this.editingNew = false;
    this.changeRef.detectChanges();
  }
  handleKeypress(event: KeyboardEvent) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
      const goToNew = !!this.addableValue
      this.transferBubble();
      if(goToNew) {
        this.addLiveItem()
      }
    }
    else if(event.key === "Backspace" && this.addableValue == "") {
      event.preventDefault();
      this.transferBubble();
      this.makeLiveItem(this.items.length-1);
    }

  }
  handleBlur() {
    this.transferBubble();
  }

  addItem(item: string) {
    this.items.push(item);
    this.editing.push(false);
    this.addables.push("")
    this.onChange(this.items);
    this.onTouched();
  }
  changeItem(item: string, index: number) {
    this.items[index] = item;
    this.onChange(this.items);
    this.onTouched();
  }
  removeItem(index: number) {
    this.items = removeAt(this.items, index);
    this.editing = removeAt(this.editing, index);
    this.addables = removeAt(this.addables, index);
    this.onChange(this.items);
    this.onTouched();
  }

  writeValue(value: string[]) {
    this.items = value;
    const len = value ? value.length : 0;
    this.editing = Array(len).map(x=>false);
    this.addables = Array(len).map(x=>"");
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
