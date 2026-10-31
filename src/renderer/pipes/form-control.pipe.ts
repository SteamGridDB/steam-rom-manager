import { PipeTransform, Pipe } from "@angular/core";
import { FormControl, FormGroup, AbstractControl } from "@angular/forms";
import { IndexedFormControl } from "../../models";

// Typed views of a control for templates. They take `| null` because
// FormGroup.get() may return null (a missing control).
@Pipe({
  name: "formControl",
})
export class FormControlPipe implements PipeTransform {
  transform(value: AbstractControl | null): FormControl<any> {
    return value as FormControl<any>;
  }
}
@Pipe({
  name: "formControlIndexed",
})
export class IndexedFormControlPipe implements PipeTransform {
  transform(value: AbstractControl | null): IndexedFormControl<any> {
    return value as IndexedFormControl<any>;
  }
}

@Pipe({
  name: "formGroup",
})
export class FormGroupPipe implements PipeTransform {
  transform(value: AbstractControl | null): FormGroup<any> {
    return value as FormGroup<any>;
  }
}
