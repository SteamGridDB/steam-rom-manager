import { Component, forwardRef, ElementRef, Optional, Host, HostListener, Input, ContentChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { NgOptionComponent } from "../components";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'ng-select',
    template: `
        <div class="display" (click)="open = !open" [class.open]="open">
            <div text-scroll>{{displayValue || placeholder || 'null'}}</div>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300">
                <polyline points="70, 110 150, 200 230, 110" />
            </svg>
        </div>
        <div class="options" [class.open]="open">
            <ng-content select="ng-option"></ng-content>
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

    private idCounter: number = -1;
    private selectedIds: number[] = [];
    private optionsMap = new Map<number, { value: any, displayValue: string }>();

    private displayValue: string = '';
    private currentValue: any[] = [];

    private onChange = (_: any) => { };
    private onTouched = () => { };

    @ContentChildren(forwardRef(() => NgOptionComponent)) private optionComponents: QueryList<NgOptionComponent>;

    @Input() private placeholder: string = '';
    @Input() private multiple: boolean = false;
    @Input() private allowEmpty: boolean = false;
    @Input() private separator: string = ', ';
    @Input() private sort: boolean = true;

    constructor(private element: ElementRef, private changeRef: ChangeDetectorRef) { }

    registerOption() {
        return ++this.idCounter;
    }

    unregisterOption(id: number) {
        if (this.selectedIds.indexOf(id) !== -1) {
            let emptyState = this.allowEmpty;
            this.allowEmpty = true;
            this.selectOption(id, true, true);
            this.allowEmpty = emptyState;
        }
        this.optionsMap.delete(id);
    }

    setOption(id: number, data: { value: any, displayValue: string }) {
        this.optionsMap.set(id, data);
    }

    selectOption(id: number, toggle: boolean, suppressChanges: boolean = false) {
        if (this.optionsMap.has(id)) {
            let valueChanged = true;

            if (this.multiple) {
                let selectedIdIndex = this.selectedIds.indexOf(id);

                if (selectedIdIndex === -1) {
                    this.selectedIds = this.selectedIds.concat(id);
                }
                else {
                    if ((this.allowEmpty || this.selectedIds.length > 1) && toggle)
                        this.selectedIds.splice(selectedIdIndex, 1);
                    else
                        valueChanged = false;
                }
            }
            else {
                if (this.selectedIds.length === 0)
                    this.selectedIds = [id];
                else if (this.selectedIds[0] !== id)
                    this.selectedIds[0] = id;
                else {
                    if (this.allowEmpty && toggle)
                        this.selectedIds = [];
                    else
                        valueChanged = false;
                }
            }

            if (valueChanged) {
                let displayValues: string[] = [];
                this.currentValue = [];
                for (let i = 0; i < this.selectedIds.length; i++) {
                    this.currentValue.push(this.optionsMap.get(this.selectedIds[i]).value);
                    displayValues.push(this.optionsMap.get(this.selectedIds[i]).displayValue);
                }

                if (displayValues.length > 0 && this.sort) {
                    displayValues = displayValues.sort();
                }

                this.displayValue = displayValues.length > 0 ? displayValues.join(this.separator) : displayValues[0];

                this.optionComponents.forEach((option) => {
                    option.toggleSelected(this.selectedIds.indexOf(option.getId()) !== -1);
                });

                if (!suppressChanges) {
                    this.onChange(this.value);
                }
                this.changeRef.markForCheck();
            }
            if (!suppressChanges) {
                this.open = this.open && this.multiple;
                this.onTouched();
            }
        }
    }

    clearOptions() {
        this.selectedIds = [];
        this.currentValue = [];
        this.displayValue = '';
        if (this.optionComponents) {
            this.optionComponents.forEach((option) => {
                option.toggleSelected(false);
            });
        }
    }

    @Input()
    set value(value: any) {
        this.writeValue(value, false);
    }

    get value() {
        return this.multiple ? this.currentValue : (this.currentValue[0] || null);
    }

    writeValue(value: any, suppressChanges: boolean = true): void {
        let optionIndex = this.getOptionId(value);
        if (optionIndex !== -1)
            this.selectOption(optionIndex, false, suppressChanges);
        else if (value instanceof Array) {
            for (let i = 0; i < value.length; i++)
                this.writeValue(value[i], suppressChanges);
        }
        else
            this.clearOptions();
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
        for (let [id, val] of this.optionsMap) {
            if (_.isEqual(val.value, value)) {
                return id;
            }
        }
        return -1;
    }
}