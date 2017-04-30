import { Component, ElementRef, Optional, Host, HostListener, Input } from '@angular/core';
import { SelectComponent } from "./ng-select.component";

@Component({
    selector: 'ng-option',
    template: `
        <ng-content></ng-content>
    `,
    styleUrls: [
        '../styles/ng-option.component.scss'
    ]
})
export class OptionComponent {
    private id: number;
    private value: any;
    private valueString: string;

    constructor(private element: ElementRef, @Optional() @Host() private select: SelectComponent) {
        if (this.select)
            this.id = this.select.registerOption();
    }

    @Input('ngValue')
    set ngValue(value: any) {
        this.value = value;
        if (this.select) {
            this.select.optionsMap.set(this.id, { value: this.value, displayValue: this.valueString });
            if (this.value === this.select.value)
                this.select.writeValue(this.select.value);
        }
    }

    @HostListener('click')
    onClick() {
        if (this.select)
            this.select.selectOption(this.id);
    }

    ngAfterViewChecked() {
        if (this.element.nativeElement) {
            this.valueString = (<HTMLElement>this.element.nativeElement).innerHTML.trim();
            if (this.valueString) {
                if (!this.value)
                    this.value = this.valueString;

                if (this.select) {
                    this.select.optionsMap.set(this.id, { value: this.value, displayValue: this.valueString });
                    if (this.value === this.select.value)
                        this.select.writeValue(this.select.value);
                }
            }
        }
    }
}