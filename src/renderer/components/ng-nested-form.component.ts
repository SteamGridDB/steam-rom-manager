import { Component, Input, Output, ChangeDetectionStrategy, OnInit, EventEmitter, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { NestedFormElement, NestedFormInputs, NestedFormElements } from "../../models";
import { Observable } from "rxjs";
import * as _ from 'lodash';

@Component({
  selector: 'ng-nested-form',
  template: `
        <ng-container [formGroup]="currentForm">
            <ng-container *ngFor="let childrenKey of nestedGroup.children | keys">
                <ng-container *ngVar="nestedGroup.children[childrenKey] as child">
                    <div class="container" [class.nested]="child.constructor.name === 'Group'" [hidden]="getHiddenMethod(child) | async">
                        <label *ngIf="child.label">
                            <span class="infoButton infoIcon" *ngIf="child.onInfoClick"
                                (click)="child.onInfoClick(currentForm.controls[childrenKey], currentForm.controls[childrenKey]['__path'])">
                            </span>
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
                                <ng-text-input [formControlName]="childrenKey" [placeholder]="child.placeholder || ''" [highlight]="child.highlight"></ng-text-input>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Path'">
                                <ng-text-input [formControlName]="childrenKey" [placeholder]="child.placeholder || ''" [highlight]="child.highlight" [appendGlob]="child.appendGlob"></ng-text-input>
                                <ng-path-input class="clickButton" [stateless]="true" [directory]="child.directory" (pathChange)="currentForm.controls[childrenKey].setValue($event)"
                                >Browse</ng-path-input>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Toggle'">
                                <ng-toggle-button [formControlName]="childrenKey">{{child.text || ''}}</ng-toggle-button>
                            </ng-container>
                            <ng-container *ngSwitchCase="'Group'">
                                <ng-nested-form class="nested" [parentForm]="currentForm" [groupName]="childrenKey" [nestedGroup]="child"></ng-nested-form>
                            </ng-container>
                        </ng-container>
                        <ng-container *ngIf="(currentForm.controls[childrenKey]?.invalid && currentForm.controls[childrenKey]?.dirty) && currentForm.controls[childrenKey]?.errors?.error">
                            <markdown class="errorMessage lastMarginZero" [content]="currentForm.controls[childrenKey].errors.error"></markdown>
                        </ng-container>
                    </div>
                </ng-container>
            </ng-container>
        </ng-container>
    `,
  styleUrls: ['../styles/ng-nested-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NgNestedFormComponent implements OnInit {
  private currentForm: FormGroup = new FormGroup({});
  private validityObservables: (()=>Observable<string>)[] = [];
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
        if (child.onValidateObservable) {
          child.onValidateObservable().subscribe((val)=>{
            this.currentForm.controls[childKey].setValue(null)
            this.currentForm.controls[childKey].markAsTouched();
            this.currentForm.controls[childKey].markAsDirty();
            this.currentForm.controls[childKey].updateValueAndValidity();
          })
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
