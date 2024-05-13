import { Component, forwardRef, Input, ChangeDetectorRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'ng-toggle-button',
    template: `
        <div *ngIf="!contentOnLeft" class="button" style="margin-right: 0.25em;">
            <div (click)="writeValue(!currentValue)" class="slider round" [class.active]="currentValue"></div>
        </div>
        <div class="content">
            <ng-content></ng-content>
        </div>
        <div *ngIf="contentOnLeft" class="button" style="margin-left: 0.25em;">
            <div (click)="writeValue(!currentValue)" class="slider round" [class.active]="currentValue"></div>
        </div>
    `,
    styleUrls: [
        '../styles/ng-toggle-button.component.scss'
    ],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NgToggleButtonComponent),
        multi: true
    }]
})
export class NgToggleButtonComponent implements ControlValueAccessor {
    @Input('contentOnLeft') contentOnLeft: boolean;

    currentValue: boolean = false;
    private onChange = (_: any) => { };
    private onTouched = () => { };

    constructor(private changeRef: ChangeDetectorRef) { }

    @Input()
    set value(value: boolean) {
        this.writeValue(value);
    }

    get value() {
        return this.currentValue;
    }

    writeValue(value: any): void {
        let previousValue = this.currentValue;
        value = !!value;

        if (value !== this.currentValue) {
            this.currentValue = value;
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
}