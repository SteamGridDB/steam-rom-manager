import { Component, forwardRef, ElementRef, Optional, Host, HostListener, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'ng-select',
    template: `
        <div id="display" (click)="open = !open" [class.open]="open">
            <span>{{displayValue}}</span>
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
        useExisting: forwardRef(() => SelectComponent),
        multi: true
    }]
})
export class SelectComponent implements ControlValueAccessor {
    private open: boolean = false;
    private idCounter: number = 0;
    private displayValue: string;
    private currentValue: any;
    @Input('placeholder') private placeholder: string;
    optionsMap = new Map<number, { value: any, displayValue: string }>();

    constructor(private element: ElementRef) { }

    onChange = (_: any) => { };
    onTouched = () => { };

    registerOption() {
        return this.idCounter++;
    }

    selectOption(id: number) {
        this.writeValue(this.optionsMap.get(id).value);
        this.open = false;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: MouseEvent) {
        if (!(<HTMLElement>this.element.nativeElement).contains(<Node>event.target))
            this.open = false;
    }

    set value(value: any) {
        let oldValue = this.currentValue;
        let displayValue = this.getDisplayValue(value);
        if (displayValue === undefined) {
            if (this.placeholder)
                this.displayValue = this.placeholder;
            else
                this.displayValue = 'null';
        }
        else
            this.displayValue = displayValue;
        this.currentValue = value;

        if (value !== oldValue)
            this.onChange(value);

        this.onTouched();
    }

    get value() {
        return this.currentValue;
    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: (value: any) => any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => any): void {
        this.onTouched = fn;
    }

    private getDisplayValue(value: any) {
        for (let [id, val] of this.optionsMap) {
            if (val.value == value) {
                return val.displayValue;
            }
        }
        return undefined;
    }
}