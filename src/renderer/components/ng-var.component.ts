import { Component, forwardRef, ElementRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'ng-div, ng-span, ng-button',
    template: `
        <ng-content></ng-content>
    `,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => VarComponent),
        multi: true
    }]
})
export class VarComponent implements ControlValueAccessor {
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