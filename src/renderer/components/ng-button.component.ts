import { Component, forwardRef, ElementRef, Optional, Host, HostListener, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'ng-button',
    template: `
        <ng-content></ng-content>
    `,
    styleUrls: [
        '../styles/ng-button.component.scss'
    ],
    host: { '[class.open]': 'open' },
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => ButtonComponent),
        multi: true
    }]
})
export class ButtonComponent implements ControlValueAccessor {
    private currentValue: any;

    constructor(private element: ElementRef) { }

    onChange = (_: any) => { };
    onTouched = () => { };

    set value(value: any) {
        let oldValue = this.currentValue;
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
}