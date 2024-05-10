import { Component, Input, Output, ChangeDetectionStrategy, OnInit, EventEmitter, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { NestedFormElement, NestedFormInputs, NestedFormElements, IndexedFormGroup, IndexedFormControl } from "../../models";
import { Observable, BehaviorSubject, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import * as _ from 'lodash';

@Component({
  selector: 'ng-nested-form',
  templateUrl: '../templates/ng-nested-form.component.html',
  styleUrls: ['../styles/ng-nested-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NgNestedFormComponent implements OnInit {
  private currentForm: IndexedFormGroup = new FormGroup({});
  private hiddenSections: BehaviorSubject<{[sectionName: string]: boolean}>;
  private sectionMap: {[elementName: string]: string} = {};
  private validityObservables: (()=>Observable<string>)[] = [];
  @Input() public parentForm: IndexedFormGroup;
  @Input() public groupName: string;
  @Input() public nestedGroup: NestedFormElement.Group;

  @Output() private parentFormChange = new EventEmitter();

  constructor(private changeRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.currentForm = this.buildFromTemplate(this.nestedGroup);
    this.hiddenSections = new BehaviorSubject<{[sectionName: string]: boolean}>({});
    this.buildSectionMap(this.nestedGroup);
    if (this.groupName)
      this.parentForm.setControl(this.groupName, this.currentForm);
    else
      this.parentFormChange.emit(this.currentForm);
  }

  private toggleHiddenSection(sectionName: string) {
    let hiddenSections = this.hiddenSections.getValue();
    if(hiddenSections[sectionName]) {
      hiddenSections[sectionName] = false;
    } else {
      hiddenSections[sectionName] = true;
    }
    this.hiddenSections.next(hiddenSections);
  }

  private isSectionHidden(sectionName: string) {
    return !!this.hiddenSections.getValue()[sectionName];
  }

  private getHiddenMethod(el: NestedFormElements, elName: string) {
    if(el instanceof NestedFormElement.Section) {
      if(el['__hidden'] === undefined) {
        if(el.isHidden !== undefined) {
          el['__hidden'] = el.isHidden();
        } else {
          el['__hidden'] = null;
        }
      }
    } else {
      if (el['__hidden'] === undefined) {
        if (el.isHidden !== undefined) {
          el['__hidden'] = combineLatest([el.isHidden(),this.hiddenSections]).pipe(map(([h,hs])=>h||!!hs[this.sectionMap[elName]||""]));
        }
        else {
          el['__hidden'] = this.hiddenSections.pipe(map(hs=>!!hs[this.sectionMap[elName]||""]));
        }
      }
    }
    return el['__hidden'];
  }

  private buildSectionMap(group: NestedFormElement.Group) {
    let currentSection = null;
    for (let childKey in group.children) {
      if (group.children[childKey] instanceof NestedFormElement.Section) {
        currentSection = childKey;
      } else if (currentSection) {
        this.sectionMap[childKey] = currentSection;
      }
    }
  }

  private buildFromTemplate(group: NestedFormElement.Group) {
    let formGroup: IndexedFormGroup = new FormGroup({});
    formGroup['__path'] = this.groupName ? (this.parentForm ? this.parentForm['__path'] : null as Array<string> || []).concat(this.groupName) : [];
    for (let childKey in group.children) {
      let notGroup = group.children[childKey] instanceof NestedFormElement.Group === false;
      let notSection = group.children[childKey] instanceof NestedFormElement.Section === false;
      if (notGroup && notSection) {
        let child = group.children[childKey] as NestedFormInputs;
        let formControl: IndexedFormControl = new FormControl();

        formControl['__path'] = formGroup['__path'].concat(childKey);
        formControl.reset({ value: child.initialValue || null, disabled: child.disabled || false }, { onlySelf: true, emitEvent: false });

        let callbacks: ((c: IndexedFormControl) => ValidationErrors)[] = [];
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
