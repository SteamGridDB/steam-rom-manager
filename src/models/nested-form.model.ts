import { AbstractControl } from '@angular/forms';
import { Observable } from "rxjs";

export type NestedInputValidator = (control: AbstractControl, path: string[]) => string;
export type NestedInputValidatorObservable = ()=>Observable<string>;
export type NestedInputInfoClick = (control: AbstractControl, path: string[]) => void;
export type NestedInputChange = (control: AbstractControl, path: string[]) => void;
export type NestedInputHidden = () => Observable<boolean> | Promise<boolean>;
export type NestedInputClick = () => any;
type ObjectFields<T> = {
  [P in keyof T]: T[P];
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
    /** Optional */
    disabled?: boolean;
    /** Optional */
    placeholder?: string;
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

    constructor(init?: ObjectFields<Input>) {
      Object.assign(this, init);
    }
  };
  export class Path {
    static displayName = 'Path';
    /** Optional */
    label?: string;
    /** Optional */
    initialValue?: string;
    /** Optional */
    directory?: boolean;
    /** Optional */
    appendGlob?: string;
    /** Optional */
    isHidden?: NestedInputHidden;
    /** Optional */
    disabled?: boolean;
    /** Optional */
    placeholder?: string;
    /** Optional */
    error?: string;
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

    constructor(init?: ObjectFields<Path>) {
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

    constructor(init?: ObjectFields<Section>) {
      Object.assign(this, init);
    }
  }

  export class Button {
    static displayName = 'Button';
    /** Mandatory */
    buttonLabel: string;
    onClickMethod: NestedInputClick;
    /** Optional */
    label?: string;
    isHidden?: NestedInputHidden;
    constructor(init?: ObjectFields<Button>) {
      Object.assign(this, init)
    }
  }
}

export type NestedFormInputs = NestedFormElement.Input | NestedFormElement.Select | NestedFormElement.Toggle | NestedFormElement.Path;
export type NestedFormElements = NestedFormInputs | NestedFormElement.Group | NestedFormElement.Section | NestedFormElement.Button;
