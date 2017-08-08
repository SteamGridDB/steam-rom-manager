import { Directive, Input, Output, EventEmitter, forwardRef, SimpleChanges, Optional, Self, ChangeDetectorRef, ɵlooseIdentical as looseIdentical } from "@angular/core";
import { NgModel } from '@angular/forms';
import { RecursiveForm, RecursiveInputValidator, RecursiveFormElements, RecursiveFormElement } from "../models";
import { Subscription } from 'rxjs';

@Directive({
    selector: '[ngRecEl]',
    exportAs: 'ngRecEl'
})
export class NgRecursiveElement {
    private subscriptions: Subscription = new Subscription();
    private validator: () => void = () => { };
    private changer: (params?: any) => void = (params?: any) => { };
    private params: any;
    private markForCheck: boolean = true;

    @Input('ngRecEl') private path: string[] = [];
    @Input('ngRecElItem') private item: RecursiveFormElements = null;

    constructor(private ngModel: NgModel, private changeRef: ChangeDetectorRef) {
        this.subscriptions.add(ngModel.valueChanges.subscribe((value: any) => {
            this.item.value = value;

            this.validator();
            this.changer();

            if (this.markForCheck) {
                this.changeRef.markForCheck();
                this.markForCheck = false;
            }
        }));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.hasOwnProperty('item')) {
            const newValue = <RecursiveFormElements>changes['item'].currentValue;

            if (changes['item'].isFirstChange() || !looseIdentical(newValue, this.item)) {
                if (this.item.onValidate)
                    this.validator = () => {
                        let error = this.ngModel.disabled ? null : (<any>this.item).onValidate(this.item, this.path);
                        if (this.item.error !== error || this.path.length > 1)
                            this.markForCheck = true;
                        this.item.error = error;
                        this.ngModel.control.setErrors(error ? { error } : null);
                    }
                else
                    this.validator = () => { /* this.markForCheck = this.markForCheck || this.path.length > 1; */ }

                if (this.item.onChange)
                    this.changer = (params?: any) => {
                        if (!this.ngModel.disabled) {
                            if ((<any>this.item).onChange(this.item, this.path, this.params))
                                this.markForCheck = true;
                        }
                    }
                else
                    this.changer = (params?: any) => { }
            }
        }
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    getPath() {
        return this.path;
    }

    mergeValue(valueTree: {}) {
        if (this.path.length > 0) {
            for (let i = 0; i < this.path.length - 1; i++) {
                if (valueTree[this.path[i]] === undefined)
                    valueTree[this.path[i]] = {};
                valueTree = valueTree[this.path[i]];
            }
            valueTree[this.path[this.path.length - 1]] = this.ngModel.control.value;
        }
    }

    setValue(newValue: any, changeParams?: any) {
        this.item.value = newValue;
        this.params = changeParams;
    }

    resetStatus() {
        this.ngModel.control.markAsPristine();
        this.ngModel.control.markAsUntouched();
    }
}