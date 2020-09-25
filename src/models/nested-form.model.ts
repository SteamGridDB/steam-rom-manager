import { AbstractControl } from '@angular/forms';
import { Observable } from "rxjs";

export type NestedInputValidator = (control: AbstractControl, path: string[]) => string;
export type NestedInputValidatorObservable = ()=>Observable<string>;
export type NestedInputInfoClick = (control: AbstractControl, path: string[]) => void;
export type NestedInputChange = (control: AbstractControl, path: string[]) => void;
export type NestedInputHidden = () => Observable<boolean> | Promise<boolean>;

type ObjectFields<T> = {
  [P in keyof T]: T[P];
};

export namespace NestedFormElement {
  export class Select {
    /** Optional */
    label?: string;
    /** Optional */
    initialValue?: any;
    /** Optional */
    isHidden?: NestedInputHidden;
    /** Optional */
    disabled?: boolean;
    /** Required */
    values: {
      /** Required */
      display: string,
        /** Optional */
        real?: any
    }[];
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
}

export type NestedFormInputs = NestedFormElement.Input | NestedFormElement.Select | NestedFormElement.Toggle;
export type NestedFormElements = NestedFormInputs | NestedFormElement.Group;
