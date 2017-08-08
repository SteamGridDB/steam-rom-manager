export type RecursiveInputValidator<T> = (item: T, path: string[]) => string;
export type RecursiveInputChanger<T> = (item: T, path: string[], params?: any) => boolean;
export type RecursiveInputInfoClick<T> = (item: T, path: string[]) => void;

type ObjectFields<T> = {
    [P in keyof T]: T[P];
};

export namespace RecursiveFormElement {
    export class Select {
        /** Optional */
        label?: string;
        /** Required */
        value: any;
        /** Optional */
        hidden?: () => boolean;
        /** Optional */
        disabled?: () => boolean;
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
        error?: string;
        /** Optional */
        onValidate?: RecursiveInputValidator<Select>;
        /** Optional */
        onChange?: RecursiveInputChanger<Select>;
        /** Optional */
        onInfoClick?: RecursiveInputInfoClick<Select>;

        constructor(init?: ObjectFields<Select>) {
            Object.assign(this, init);
        }
    };
    export class Input {
        /** Optional */
        label?: string;
        /** Required */
        value: string;
        /** Optional */
        hidden?: () => boolean;
        /** Optional */
        disabled?: () => boolean;
        /** Optional */
        placeholder?: string;
        /** Optional */
        error?: string;
        /** Optional */
        onValidate?: RecursiveInputValidator<Input>;
        /** Optional */
        onChange?: RecursiveInputChanger<Input>;
        /** Optional */
        onInfoClick?: RecursiveInputInfoClick<Input>;

        constructor(init?: ObjectFields<Input>) {
            Object.assign(this, init);
        }
    };
    export class Path {
        /** Optional */
        label?: string;
        /** Required */
        value: string;
        /** Optional */
        directory?: boolean;
        /** Optional */
        hidden?: () => boolean;
        /** Optional */
        disabled?: () => boolean;
        /** Optional */
        placeholder?: string;
        /** Optional */
        error?: string;
        /** Optional */
        onValidate?: RecursiveInputValidator<Path>;
        /** Optional */
        onChange?: RecursiveInputChanger<Path>;
        /** Optional */
        onInfoClick?: RecursiveInputInfoClick<Path>;

        constructor(init?: ObjectFields<Path>) {
            Object.assign(this, init);
        }
    };
    export class Toggle {
        /** Optional */
        label?: string;
        /** Required */
        value: boolean;
        /** Optional */
        hidden?: () => boolean;
        /** Optional */
        disabled?: () => boolean;
        /** Optional */
        text?: string;
        /** Optional */
        error?: string;
        /** Optional */
        onValidate?: RecursiveInputValidator<Toggle>;
        /** Optional */
        onChange?: RecursiveInputChanger<Toggle>;
        /** Optional */
        onInfoClick?: RecursiveInputInfoClick<Toggle>;

        constructor(init?: ObjectFields<Toggle>) {
            Object.assign(this, init);
        }
    };
}

export type RecursiveFormElements = RecursiveFormElement.Input | RecursiveFormElement.Path | RecursiveFormElement.Select | RecursiveFormElement.Toggle;

export interface RecursiveForm {
    [key: string]: RecursiveFormElements | RecursiveForm
}