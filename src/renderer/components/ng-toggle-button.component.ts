import { Component, forwardRef, ElementRef, ViewChildren, QueryList, Input, EventEmitter, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'ng-toggle-button',
    template: `
        <div *ngIf="!contentOnLeft" class="button" style="margin-right: 0.25em;">
            <svg [class.active]="currentValue" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 220 100">
                <path (click)="writeValue(!currentValue)" d="M60 10 c -60 0, -60 80, 0 80 h 100 c 60 0, 60 -80, 0 -80 h -100" stroke-width="3" />
                <circle id="shape" (click)="writeValue(!currentValue)" [attr.cx]="(currentValue ? 165: 55)" cy="50" r="43" stroke-width="2">
                    <animate #animation begin="indefinite" attributeName="cx" dur="150ms" [attr.from]="(currentValue ? 55: 165)" [attr.to]="(currentValue ? 165: 55)" />
                </circle>
            </svg>
        </div>
        <div class="content">
            <ng-content></ng-content>
        </div>
        <div *ngIf="contentOnLeft" class="button" style="margin-left: 0.25em;">
            <svg [class.active]="currentValue" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 220 100">
                <path (click)="writeValue(!currentValue)" d="M60 10 c -60 0, -60 80, 0 80 h 100 c 60 0, 60 -80, 0 -80 h -100" stroke-width="3" />
                <circle id="shape" (click)="writeValue(!currentValue)" [attr.cx]="(currentValue ? 165: 55)" cy="50" r="43" stroke-width="2">
                    <animate #animation begin="indefinite" attributeName="cx" dur="150ms" [attr.from]="(currentValue ? 55: 165)" [attr.to]="(currentValue ? 165: 55)" />
                </circle>
            </svg>
        </div>
    `,
    styleUrls: [
        '../styles/ng-toggle-button.component.scss'
    ],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => ToggleButtonComponent),
        multi: true
    }]
})
export class ToggleButtonComponent implements ControlValueAccessor {
    @Input('contentOnLeft') private contentOnLeft: boolean;
    @ViewChildren('animation', { read: ElementRef }) private animation: QueryList<ElementRef>;
    @Output() private change = new EventEmitter();
    @Output() private touched = new EventEmitter();
    private onTouchedNgModel: () => void = () => {};
    private onChangeNgModel: (_: any) => void = () => {};
    private currentValue: any = false;

    constructor(private element: ElementRef) { }
    
    @Input()
    set value(value: any) {
        let oldValue = this.currentValue;
        this.currentValue = !!value;

        if (value !== oldValue){
            this.change.emit(value);
            this.onChangeNgModel(value);
            if (this.animation && this.animation.first){
                this.animation.first.nativeElement.beginElement();
            }
        }

        this.touched.emit();
        this.onTouchedNgModel();
    }

    get value() {
        return this.currentValue;
    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: (value: any) => any): void {
        this.onChangeNgModel = fn;
    }

    registerOnTouched(fn: () => any): void {
        this.onTouchedNgModel = fn;
    }
}