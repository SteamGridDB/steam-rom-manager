import { Component, forwardRef, ElementRef, Optional, Host, HostListener, Input,Output, ContentChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as _ from 'lodash';

const removeAt = (arr: any[],index: number) => arr.slice(0, index).concat(arr.slice(index + 1));

@Component({
  selector: 'ng-bubbles',
  template: `
<div class="bubblesContainer">
<ng-container *ngFor="let item of items; let i=index">
    <div class="bubble">
        <span>{{item}}</span>
        <svg [hover]="true" xdelete class="delete" (click)="removeItem(i)"></svg>
    </div>
</ng-container>
</div>
  `,
  styleUrls: [
    '../styles/ng-bubbles.component.scss'
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgBubblesComponent),
    multi: true
  }]
})

export class NgBubblesComponent implements ControlValueAccessor {
    private onChange = (_: any) => { };
    private onTouched = () => { };
    items: string[] = [];
    @Input() set bubbleItems(value: string[]) {
        this.writeValue(value);
    }
  constructor(private element: ElementRef, private changeRef: ChangeDetectorRef) {
  }

  get value() {
    return this.items;
  }

  removeItem(index: number) {
    this.items = removeAt(this.items, index);
    this.onChange(this.items);
    this.onTouched();
  }

  writeValue(value: string[]) {
    this.items = value;
    this.onChange(this.items)
    this.changeRef.detectChanges();
    this.onTouched();
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }
}
