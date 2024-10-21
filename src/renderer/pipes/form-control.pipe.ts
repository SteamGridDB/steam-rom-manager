import { PipeTransform, Pipe } from "@angular/core";
import { FormControl, FormGroup, AbstractControl } from "@angular/forms";
import { IndexedFormControl } from "../../models";
@Pipe({
  name: "formControl",
})
export class FormControlPipe implements PipeTransform {
  transform(value: AbstractControl): FormControl<(typeof value)["value"]> {
    return value as FormControl<(typeof value)["value"]>;
  }
}
@Pipe({
  name: "formControlIndexed",
})
export class IndexedFormControlPipe implements PipeTransform {
  transform(value: AbstractControl): IndexedFormControl<(typeof value)["value"]> {
    return value as IndexedFormControl<(typeof value)["value"]>;
  }
}


@Pipe({
  name: "formGroup",
})
export class FormGroupPipe implements PipeTransform {
  transform(value: AbstractControl): FormGroup<(typeof value)["value"]> {
    return value as FormGroup<(typeof value)["value"]>;
  }
}
