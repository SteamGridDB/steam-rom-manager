import {
  Component,
  forwardRef,
  ElementRef,
  HostListener,
  Input,
  Output,
  ChangeDetectorRef,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import * as _ from "lodash";
import { SelectItem, StringDict } from "../../models";
import fuzzysort from 'fuzzysort';
import { NgTextInputComponent } from "./ng-text-input.component";

@Component({
  selector: "ng-select",
  template: `
      <div
        class="display"
        *ngIf="!searchable"
        (click)="toggleOpen()"
        [class.open]="open"
      >
        <div text-scroll>{{ currentDisplay || placeholder || "null" }}</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 300 300"
        >
          <polyline points="70, 110 150, 200 230, 110" />
        </svg>
      </div>
      <ng-text-input
        *ngIf="searchable"
        class="display"
        [placeholder]="placeholder"
        (click)="toggleOpen(); searchText=''; allowAutoOpen=true; autoFocus(searchEl)"
        [class.open]="open"
        [(ngModel)]="searchText"
        (ngModelChange)="searchText = $event; filterOptions($event); open=allowAutoOpen?true:open"
        value="searchText;"
        autoFocus="false"
        #searchEl
      >
      </ng-text-input>
      <div class="options" [class.open]="open">
        <ng-container *ngIf="_sections.length">
          <ng-container *ngFor="let option of optionsList; let i = index">
            <ng-container
              *ngIf="_sectionsList[i.toString()] && !searchText.length"
            >
              <div class="sectionTitle">
                {{ _sectionsList[i.toString()].name }}
              </div>
            </ng-container>
            <ng-option
              text-scroll
              [displayValue]="option.displayValue"
              [isSelected]="selected.indexOf(i) >= 0"
              [isHidden]="
                searchable && searchText.length && filtered.indexOf(i) < 0
              "
              (click)="selectOption(i, true);"
            >
              {{ option.displayValue }}
            </ng-option>
          </ng-container>
        </ng-container>
        <ng-container *ngIf="!_sections.length">
          <ng-option
            text-scroll
            *ngFor="let option of optionsList; let i = index"
            [displayValue]="option.displayValue"
            [isSelected]="selected.indexOf(i) >= 0"
            [isHidden]="
              searchable && searchText.length && filtered.indexOf(i) < 0
            "
            (click)="selectOption(i, true)"
          >
            {{ option.displayValue }}
          </ng-option>
        </ng-container>
        <div *ngIf="searchable && searchText.length && !filtered.length"
            text-scroll
            class="fakeOption"
          >
            No results...
          </div>
          <div *ngIf="searchable && open && !optionsList.length"
            text-scroll
            class="fakeOption"
          >
            Options Loading...
          </div>
      </div>
  `,
  styleUrls: ["../styles/ng-select.component.scss"],
  host: { "[class.open]": "open" },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgSelectComponent),
      multi: true,
    },
  ],
})
export class NgSelectComponent implements ControlValueAccessor {
  open: boolean = false;
  allowAutoOpen: boolean = false;
  optionsList: SelectItem[] = [];
  _sectionsMap: StringDict = {};
  _sections: string[] = [];
  _sectionsList: {
    [tally: string]: {
      name: string;
      options: SelectItem[];
    };
  } = {};
  currentDisplay: string = "";
  private currentValue: any[] = [];

  private onChange = (_: any) => {};
  private onTouched = () => {};

  @Input() placeholder: string = "";
  @Input() searchable: boolean = false;
  @Input() private multiple: boolean = false;
  @Input() private allowEmpty: boolean = false;
  @Input() private separator: string = ", ";
  @Input() private sort: boolean = true;
  @Input() private emitOnly: boolean = false;
  @Input() get sectionsMap() {
    return this._sectionsMap;
  }
  set sectionsMap(sectionsMap: StringDict) {
    if (sectionsMap) {
      this._sectionsMap = sectionsMap;
      this._sections = _.uniq(Object.values(sectionsMap));
      this.changeOptions(this.optionsList);
    }
  }
  @Output() searchText: string = "";
  @Output() filtered: number[] = [];
  @Output() selected: number[] = [];
  constructor(
    private element: ElementRef,
    private changeRef: ChangeDetectorRef,
  ) {}

  changeOptions(newOptions: SelectItem[]) {
    let currentOptions = this.selected.map((i) => this.optionsList[i]);
    let newSelected: SelectItem[] = _.intersectionWith(
      newOptions,
      currentOptions,
      _.isEqual,
    );
    let sortedOptions: SelectItem[];
    if (this._sections.length) {
      this._sectionsList = this.getSectionList(newOptions);
      sortedOptions = _.flatten(
        Object.values(this._sectionsList).map((sec) => sec.options),
      );
    } else {
      sortedOptions = newOptions;
    }
    this.optionsList = sortedOptions;
    this.selected = newSelected.map((value) =>
      _.findIndex(this.optionsList, (e) => _.isEqual(e, value)),
    );
    this.changeRef.detectChanges();
  }

  toggleOpen() {
    this.open = !this.open;
    this.changeRef.detectChanges();
  }
  autoFocus(searchEl: NgTextInputComponent) {
    searchEl.focus();
  }

  getSectionList(optionsList: SelectItem[]) {
    let running = 0;
    const sections: {
      [tally: string]: {
        name: string;
        options: SelectItem[];
      };
    } = {};
    for (let sec of this._sections) {
      sections[running.toString()] = {
        name: sec,
        options: optionsList
          .filter((item) => this._sectionsMap[item.value] == sec)
          .sort((a, b) => a.displayValue.localeCompare(b.displayValue)),
      };
      running += optionsList.filter(
        (item) => this._sectionsMap[item.value] == sec,
      ).length;
    }
    const unmatched = optionsList.filter(
      (item) => !this._sectionsMap[item.value],
    );
    if (unmatched.length) {
      sections[running.toString()] = {
        name: "Uncategorized",
        options: optionsList.sort((a, b) =>
          a.displayValue.localeCompare(b.displayValue),
        ),
      };
    }
    return sections;
  }

  selectOption(id: number, toggle: boolean, suppressChanges: boolean = false) {
    let valueChanged = true;
    let selectedIds = this.selected;

    if (this.multiple) {
      let selectedIdIndex = selectedIds.indexOf(id);

      if (selectedIdIndex === -1) {
        selectedIds = selectedIds.concat(id);
      } else {
        if ((this.allowEmpty || selectedIds.length > 1) && toggle)
          selectedIds.splice(selectedIdIndex, 1);
        else valueChanged = false;
      }
    } else {
      if (selectedIds.length === 0) {
        selectedIds = [id];
      } else if (selectedIds[0] !== id) {
        selectedIds[0] = id;
      } else {
        if (this.allowEmpty && toggle) selectedIds = [];
        else valueChanged = false;
      }
    }

    if (valueChanged) {
      let currentDisplays: string[] = [];
      let currentValue = [];

      for (let i = 0; i < selectedIds.length; i++) {
        currentValue.push(this.optionsList[selectedIds[i]].value);
        currentDisplays.push(this.optionsList[selectedIds[i]].displayValue);
      }
      if (this.searchable) {
        if (selectedIds.length) {
          this.searchText =
            this.optionsList[selectedIds[selectedIds.length - 1]].displayValue;
        } else {
          this.searchText = "";
        }
        setTimeout(()=>{ this.open = false; this.changeRef.detectChanges(); },10)
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
        this.onChange(this.multiple ? currentValue : currentValue[0] || null);
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
    this.currentDisplay = "";
  }

  @Input()
  set value(value: any) {
    this.writeValue(value, false);
  }

  get value() {
    return this.multiple ? this.currentValue : this.currentValue[0] || null;
  }

  @Input()
  set values(values: SelectItem[] | string[]) {
    if (values && values.length) {
      if ((values[0] as SelectItem).displayValue !== undefined) {
        this.changeOptions(values as SelectItem[]);
      } else {
        this.changeOptions(
          (values as string[]).map((option: string) => {
            return { displayValue: option, value: option };
          }) as SelectItem[],
        );
      }
    } else {
      this.changeOptions([] as SelectItem[]);
    }
  }

  get values() {
    return this.optionsList;
  }

  writeValue(value: any, suppressChanges: boolean = false): void {
    if (value instanceof Array) {
      this.selected = [];
      for (let i = 0; i < value.length; i++) {
        this.writeValue(value[i], suppressChanges);
      }
      if (!value.length) {
        this.clearOptions();
      }
    } else {
      let optionIndex = this.getOptionId(value);
      if (optionIndex !== -1) {
        this.selectOption(optionIndex, false, suppressChanges);
      } else if (this.values.length == 0 && value && value.title) {
        this.changeOptions([
          {
            value: value,
            displayValue: value.title,
          },
        ]);
        this.selectOption(0, false);
      } else {
        this.clearOptions();
      }
    }
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }

  @HostListener("document:click", ["$event"])
  onClick(event: MouseEvent) {
    if (!(<HTMLElement>this.element.nativeElement).contains(<Node>event.target))
      this.open = false;
  }

  filterOptions(filter: string) {
    this.filtered = fuzzysort.go(filter,this.optionsList.map((opt,i)=>({...opt, i})), {
      key: 'displayValue',
    }).map(res=>res.obj.i);
  }

  private getOptionId(value: any) {
    return _.findIndex(
      this.optionsList.map((option) => option.value),
      (e) => _.isEqual(e, value),
    );
  }
}
