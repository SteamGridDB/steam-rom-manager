import { Component, forwardRef, ElementRef, Input, Output, ViewChild, HostListener, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as path from 'path';

@Component({
    selector: 'ng-path-input',
    template: `
        <ng-content></ng-content>
        <input style="display: none;" #fileInput type="file" [attr.webkitdirectory]="(directory === true ? true : null)" (change)="readInput()"/>
    `,
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => NgPathInputComponent),
        multi: true
    }]
})
export class NgPathInputComponent implements ControlValueAccessor {
    @ViewChild('fileInput', { read: ElementRef })
    private fileInput: ElementRef;
    private currentValue: string = null;
    private onChange = (_: any) => { };
    private onTouched = () => { };

    @Input() private directory: boolean = false;
    @Input() private stateless: boolean = false;
    @Output() private pathChange: EventEmitter<string> = new EventEmitter();

    constructor() { }

    @HostListener('click')
    onClick() {
        if (this.fileInput && this.fileInput.nativeElement) {
            let fileInput = <HTMLInputElement>this.fileInput.nativeElement;
            fileInput.click();
        }
    }

    private readInput() {
        let fileInput = <HTMLInputElement>this.fileInput.nativeElement;
        if (fileInput.files && fileInput.files.length) {
            if (fileInput.webkitdirectory) {
                this.writeValue(path.dirname(fileInput.files[0].path));
            } else {
                this.writeValue(fileInput.files[0].path);
            }
            fileInput.value = null;
        }
    }

    @Input()
    set value(value: string) {
        this.writeValue(value);
    }

    get value() {
        return this.currentValue;
    }

    writeValue(value: any): void {
        let oldValue = this.currentValue;

        if (value !== oldValue) {
            this.currentValue = this.stateless ? null : value;
            this.onChange(value);
            this.pathChange.next(value);
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