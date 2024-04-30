import { Component, forwardRef, ElementRef, Optional, Host, HostListener, Input,Output, ContentChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { NgOptionComponent, NgTextInputComponent } from "../components";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as _ from 'lodash';
import {SelectItem} from "../../models";

@Component({
  selector: 'ng-select',
  template: `
  <div class="display" *ngIf="!searchable" (click)="toggleOpen()" [class.open]="open">
  <div text-scroll>{{currentDisplay || placeholder || 'null'}}</div>
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300">
    <polyline points="70, 110 150, 200 230, 110" />
  </svg>
  </div>
  <ng-text-input *ngIf="searchable" class="display" [placeholder]="placeholder" (click)="open = !open" [class.open]="open" [(ngModel)]="searchText" (ngModelChange)="searchText=$event;filterOptions($event);" value="searchText;">
  </ng-text-input>
  <div class="options" [class.open]="open">
  <ng-option text-scroll *ngFor="let option of optionsList; let i = index"
  [displayValue]="option.displayValue"
  [isSelected]="selected.indexOf(i)>=0"
  [isHidden]="searchable&&searchText.length&&filtered.indexOf(i)>=0"
  (click)="selectOption(i, true)">
  {{option.displayValue}}
  </ng-option>
  </div>
  `,
  styleUrls: [
    '../styles/ng-select.component.scss'
  ],
  host: { '[class.open]': 'open' },
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgSelectComponent),
      multi: true
  }]
})

export class NgSelectComponent implements ControlValueAccessor {
  private open: boolean = false;

  private optionsList: SelectItem[] = [];
  private currentDisplay: string = '';
  private currentValue: any[] = [];

  private onChange = (_: any) => { };
  private onTouched = () => { };

  @Input() private placeholder: string = '';
  @Input() private multiple: boolean = false;
  @Input() private allowEmpty: boolean = false;
  @Input() private separator: string = ', ';
  @Input() private sort: boolean = true;
  @Input() private emitOnly: boolean = false;
  @Input() private searchable: boolean = false;
  @Output() searchText: string='';
  @Output() filtered: number[] = [];
  @Output() selected: number[] = [];
  constructor(private element: ElementRef, private changeRef: ChangeDetectorRef) {
  }

  changeOptions(newOptions: SelectItem[]) {
    let currentOptions = this.selected.map(i=>this.optionsList[i]);
    let newSelected = _.intersectionWith(newOptions, currentOptions, _.isEqual);
    this.optionsList = newOptions;
    this.selected = newSelected.map(value=>_.findIndex(this.optionsList,(e)=>_.isEqual(e,value)));
  }

  private toggleOpen() {
    this.open = !this.open;
    this.changeRef.detectChanges();
  }
  selectOption(id: number, toggle: boolean, suppressChanges: boolean = false) {
    let valueChanged = true;
    let selectedIds =  this.selected;

    if (this.multiple) {
      let selectedIdIndex = selectedIds.indexOf(id);

      if (selectedIdIndex === -1) {
        selectedIds = selectedIds.concat(id);
      }
      else {
        if ((this.allowEmpty || selectedIds.length > 1) && toggle)
          selectedIds.splice(selectedIdIndex, 1);
        else
          valueChanged = false;
      }
    }
    else {
      if (selectedIds.length === 0) {
        selectedIds = [id];
      }
      else if (selectedIds[0] !== id){
        selectedIds[0] = id;
      }
      else {
        if (this.allowEmpty && toggle)
          selectedIds = [];
        else
          valueChanged = false;
      }
    }

    if (valueChanged) {
      let currentDisplays: string[] = [];
      let currentValue = [];

      for (let i = 0; i < selectedIds.length; i++) {
        currentValue.push(this.optionsList[selectedIds[i]].value);
        currentDisplays.push(this.optionsList[selectedIds[i]].displayValue);
      }
      if(this.searchable) {
        if(selectedIds.length) {
          this.searchText = this.optionsList[selectedIds[selectedIds.length-1]].displayValue
        } else{
          this.searchText = "";
        }
      }

      if (currentDisplays.length > 0 && this.sort) {
        currentDisplays = currentDisplays.sort();
      }

      if (!this.emitOnly) {
        this.currentDisplay = currentDisplays.join(this.separator);
        this.currentValue = currentValue;
        this.selected = selectedIds;
      }

      if (!suppressChanges) {
        this.onChange(this.multiple ? currentValue : (currentValue[0] || null));
      }

      this.changeRef.markForCheck();
    }
    if (!suppressChanges) {
      this.open = this.open && this.multiple;
      this.onTouched();
    }
  }

  clearOptions() {
    this.selected = [];
    this.currentValue = [];
    this.currentDisplay = '';
  }

  @Input()
  set value(value: any) {
    this.writeValue(value, false);
  }

  get value() {
    return this.multiple ? this.currentValue : (this.currentValue[0] || null);
  }

  @Input()
  set values(values: SelectItem[]|string[]) {
    if(values && values.length) {
      if((values[0] as SelectItem).displayValue!==undefined) {
        this.changeOptions(values as SelectItem[])
      } else {
        this.changeOptions((values as string[]).map((option: string) => {
          return {displayValue: option, value: option}
        }) as SelectItem[]);
      }
    } else {
      this.changeOptions([] as SelectItem[])
    }

  }

  get values() {
    return this.optionsList;
  }

  writeValue(value: any, suppressChanges: boolean = true): void {
    let optionIndex = this.getOptionId(value);
    if (optionIndex !== -1)
      this.selectOption(optionIndex, false, suppressChanges);
    else if (value instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        this.writeValue(value[i], suppressChanges);
      }
      if(!value.length) {
        this.clearOptions();
      }
    }
    else if (this.values.length==0 && value && value.title) {
      this.changeOptions([{
        value: value,
        displayValue: value.title
      }]);
      this.selectOption(0, false);
    }
    else {
      this.clearOptions();
    }
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!(<HTMLElement>this.element.nativeElement).contains(<Node>event.target))
      this.open = false;
  }

  private getOptionId(value: any) {
    return _.findIndex(this.optionsList.map(option=>option.value), (e)=>_.isEqual(e,value))
  }

  private filterOptions(filter: string){
    let filteredIds: number[]=[];
    for(let id=0; id < this.optionsList.length; id++) {
      if(!this.optionsList[id].displayValue.toUpperCase().includes(filter.toUpperCase())){
        filteredIds.push(id)
      }
    }
    this.filtered = filteredIds;
  }
}
