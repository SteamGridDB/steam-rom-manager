import { Component, Input, Output, ChangeDetectionStrategy, OnInit, EventEmitter, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { NestedFormElement, NestedFormInputs, NestedFormElements } from "../models";
import * as _ from 'lodash';
import { Observable } from "rxjs";

@Component({
    selector: 'ng-nested-form',
    template: `
        <ng-container [formGroup]="currentForm">
            <ng-container *ngFor="let childrenKey of nestedGroup.children | keys">
                <ng-container *ngVar="nestedGroup.children[childrenKey] as child">
                    <div class="container" [class.nested]="child.constructor.name === 'Group'" [hidden]="getHiddenMethod(child) | async">
                        <label *ngIf="child.label">
                            <svg class="infoButton" info-icon [hover]="true" *ngIf="child.onInfoClick" 
                                (click)="child.onInfoClick(currentForm.controls[childrenKey], currentForm.controls[childrenKey]['__path'])">
                            </svg>
                            {{child.label}}
                        </label>
                        <ng-container [ngSwitch]="child.constructor.name">
                            <ng-container *ngSwitchCase="'Select'">
                                <ng-select [formControlName]="childrenKey" [placeholder]="child.placeholder" [multiple]="child.multiple" [allowEmpty]="child.allowEmpty">
                                    <ng-option *ngFor="let value of child.values" [ngValue]="value.real || value.display">
                                        {{value.display}}
                                    </ng-option>
                                </ng-select>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Input'">
                                <input [formControlName]="childrenKey" [placeholder]="child.placeholder || ''"/>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Path'">
                                <input [formControlName]="childrenKey" [placeholder]="child.placeholder || ''"/>
                                <ng-path-input class="clickButton" [directory]="child.directory" (pathChange)="currentForm.controls[childrenKey].setValue($event)" 
                                >Browse</ng-path-input>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Toggle'">
                                <ng-toggle-button [formControlName]="childrenKey">{{child.text || ''}}</ng-toggle-button>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Group'">
                                <ng-nested-form class="nested" [parentForm]="currentForm" [groupName]="childrenKey" [nestedGroup]="child"></ng-nested-form>
                            </ng-container>
                        </ng-container>
                        <div class="errorMessage" [hidden]="currentForm.controls[childrenKey].valid || currentForm.controls[childrenKey].pristine">
                            {{currentForm.controls[childrenKey].errors?.error}}
                        </div>
                    </div>
                </ng-container>
            </ng-container>
        </ng-container>
    `,
    styleUrls: ['../styles/ng-nested-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NestedFormComponent implements OnInit {
    private currentForm: FormGroup = new FormGroup({});

    @Input() public parentForm: FormGroup;
    @Input() public groupName: string;
    @Input() public nestedGroup: NestedFormElement.Group;

    @Output() private parentFormChange = new EventEmitter();

    constructor(private changeRef: ChangeDetectorRef) { }

    ngOnInit() {
        this.currentForm = this.buildFromTemplate(this.nestedGroup);

        if (this.groupName)
            this.parentForm.setControl(this.groupName, this.currentForm);
        else
            this.parentFormChange.next(this.currentForm);
    }

    private getHiddenMethod(el: NestedFormElements) {
        if (el['__hidden'] === undefined) {
            if (el.isHidden !== undefined) {
                el['__hidden'] = el.isHidden();
            }
            else {
                el['__hidden'] = null;
            }
        }
        return el['__hidden'];
    }

    private buildFromTemplate(group: NestedFormElement.Group) {
        let formGroup = new FormGroup({});
        formGroup['__path'] = this.groupName ? (this.parentForm ? this.parentForm['__path'] : null as Array<string> || []).concat(this.groupName) : [];

        for (let childKey in group.children) {
            if (group.children[childKey] instanceof NestedFormElement.Group === false) {
                let child = group.children[childKey] as NestedFormInputs;
                let formControl = new FormControl();

                formControl['__path'] = formGroup['__path'].concat(childKey);
                formControl.reset({ value: child.initialValue || null, disabled: child.disabled || false }, { onlySelf: true, emitEvent: false });

                let callbacks: ValidatorFn[] = [];

                if (child.onValidate) {
                    callbacks.push((c) => {
                        let error = child.onValidate(c, c['__path']);
                        return error ? { error } : null;
                    });
                }

                if (child.onChange) {
                    callbacks.push((c) => {
                        child.onChange(c, c['__path']);
                        return null;
                    });
                }

                formControl.setValidators(callbacks);

                formGroup.setControl(childKey, formControl);
            }
        }

        return formGroup;
    }
}