import { AbstractControl, FormGroup, FormControl } from '@angular/forms';
import { Observable } from "rxjs";

export interface IndexedFormGroup extends FormGroup {
  __path?: string[]
}
export interface IndexedFormControl extends FormControl {
  __path?: string[]
}

export type NestedInputValidator = (control: AbstractControl, path: string[]) => string;
export type NestedInputValidatorObservable = ()=>Observable<string>;
export type NestedInputInfoClick = (control: AbstractControl, path: string[]) => void;
export type NestedInputChange = (control: AbstractControl, path: string[]) => void;
export type NestedInputHiddenValue = Observable<boolean> | Promise<boolean>;
export type NestedInputHidden = () => NestedInputHiddenValue;
export type NestedInputClick = () => any;
export type NestedInputControlClick = (control: AbstractControl) => any
type ObjectFields<T> = {
  [P in keyof Omit<T,"__hidden">]: T[P];
};

export type SelectItem = {
  displayValue: string,
  value: any
}

export namespace NestedFormElement {
  export class Select {
    static displayName = 'Select';
    /** Optional */
    label?: string;
    /** Optional */
    initialValue?: any;
    /** Optional */
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;
    /** Optional */
    disabled?: boolean;
    /** Required */
    values: SelectItem[]|string[];
    /** Optional */
    placeholder?: string;
    /** Optional */
    multiple?: boolean
    /** Optional */
    allowEmpty?: boolean
    /** Optional */
    required?: boolean
    /** Optional */
    onValidate?: NestedInputValidator;
    /** Optional */
    onValidateObservable?: NestedInputValidatorObservable;
    /** Optional */
    onChange?: NestedInputChange;
    /** Optional */
    onInfoClick?: NestedInputInfoClick;

    constructor(init?: ObjectFields<Select>) {
      Object.assign(this, init);
    }
  };
  export class Input {
    static displayName = 'Input';
    /** Optional */
    label?: string;
    /** Optional */
    initialValue?: string;
    /** Optional */
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;
    /** Optional */
    disabled?: boolean;
    /** Optional */
    placeholder?: string;
    /** Optional */
    required?: boolean
    /** Optional */
    onValidate?: NestedInputValidator;
    /** Optional */
    onValidateObservable?: NestedInputValidatorObservable;
    /** Optional */
    onChange?: NestedInputChange;
    /** Optional */
    onInfoClick?: NestedInputInfoClick;
    /** Optional */
    highlight?: (input: string, tag: string) => string;
    /** Optional */
    path?: {
      directory?: boolean,
      appendGlob?: string
    }
    /** Optional */
    buttons?: Button[];

    constructor(init?: ObjectFields<Input>) {
      Object.assign(this, init);
    }
  };
  export class Toggle {
    static displayName = 'Toggle';
    /** Optional */
    label?: string;
    /** Optional */
    initialValue?: boolean;
    /** Optional */
    text?: string;
    /** Optional */
    disabled?: boolean;
    /** Optional */
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;
    /** Optional */
    onValidate?: NestedInputValidator;
    /** Optional */
    onValidateObservable?: NestedInputValidatorObservable;
    /** Optional */
    onChange?: NestedInputChange;
    /** Optional */
    onInfoClick?: NestedInputInfoClick;

    constructor(init?: ObjectFields<Toggle>) {
      Object.assign(this, init);
    }
  };
  export class Group {
    static displayName = 'Group';
    /** Optional */
    label?: string;
    /** Optional */
    onInfoClick?: NestedInputInfoClick;
    /** Optional */
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;
    /** Optional */
    children?: { [key: string]: NestedFormElements };

    constructor(init?: ObjectFields<Group>) {
      Object.assign(this, init);
    }
  };

  export class Section {
    static displayName = 'Section';
    /** Mandatory */
    label: string;
    /** Optional */
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;

    constructor(init?: ObjectFields<Section>) {
      Object.assign(this, init);
    }
  }

  export class Button {
    static displayName = 'Button';
    /** Mandatory */
    buttonLabel: string;
    onClickMethod?: NestedInputClick;
    onClickControlMethod?: NestedInputControlClick
    /** Optional */
    label?: string;
    isHidden?: NestedInputHidden;
    __hidden: NestedInputHiddenValue;
    constructor(init?: ObjectFields<Button>) {
      Object.assign(this, init)
    }
  }
}

export type NestedFormInputs = NestedFormElement.Input | NestedFormElement.Select | NestedFormElement.Toggle;
export type NestedFormElements = NestedFormInputs | NestedFormElement.Group | NestedFormElement.Section | NestedFormElement.Button;
