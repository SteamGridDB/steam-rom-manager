import { Component, ElementRef, Optional, Host, HostListener, Input } from '@angular/core';
import { SelectComponent } from "./ng-select.component";

@Component({
    selector: 'ng-option',
    template: `
        <ng-content></ng-content>
    `,
    styleUrls: [
        '../styles/ng-option.component.scss'
    ],
    host: {
        '[class.selected]': 'isSelected',
    }
})
export class OptionComponent {
    private id: number;
    private value: any;
    private valueString: string;
    private isSelected: boolean = false;

    constructor(private element: ElementRef, @Optional() @Host() private select: SelectComponent) {
        if (this.select)
            this.id = this.select.registerOption();
    }

    @Input()
    set ngValue(value: any) {
        this.value = value;
        if (this.select)
            this.select.setOption(this.id, { value: this.value, displayValue: JSON.stringify(this.value) });
    }

    @HostListener('click')
    onClick() {
        if (this.select)
            this.select.selectOption(this.id, true);
    }

    getId(){
        return this.id;
    }

    toggleSelected(selected: boolean) {
        this.isSelected = selected;
    }

    ngAfterViewChecked() {
        if (this.element.nativeElement) {
            this.valueString = (<HTMLElement>this.element.nativeElement).innerHTML.trim();
            if (this.valueString) {
                if (this.value === undefined)
                    this.value = this.valueString;

                if (this.select)
                    this.select.setOption(this.id, { value: this.value, displayValue: this.valueString });
            }
        }
    }

    ngOnDestroy() {
        if (this.select)
            this.select.unregisterOption(this.id);
    }
}