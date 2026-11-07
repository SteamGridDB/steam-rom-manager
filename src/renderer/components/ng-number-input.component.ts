import {
  Component,
  forwardRef,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";

// A number field (a form control whose value is a number). Empty, or not a
// number, is `min` (or 0); values are kept within min and max.
@Component({
  selector: "ng-number-input",
  template: `<input
      type="number"
      [attr.min]="min"
      [attr.max]="max"
      [attr.step]="step"
      [attr.placeholder]="placeholder"
      [value]="value"
      (input)="typed($event.target)"
      (blur)="settle($event.target)"
    />
    @if (unit) {
      <span class="unit">{{ unit }}</span>
    }`,
  styleUrls: ["../styles/ng-number-input.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgNumberInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgNumberInputComponent implements ControlValueAccessor {
  @Input() min: number | null = 0;
  @Input() max: number | null = null;
  @Input() step: number | "any" = "any";
  @Input() placeholder = "";
  // Shown after the number (e.g. "s").
  @Input() unit = "";

  value: number | null = null;
  private onChange = (_: number) => {};
  private onTouched = () => {};

  constructor(private changeRef: ChangeDetectorRef) {}

  private clamp(raw: unknown): number {
    let n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    if (!Number.isFinite(n)) n = this.min ?? 0;
    if (this.min !== null && n < this.min) n = this.min;
    if (this.max !== null && n > this.max) n = this.max;
    return n;
  }

  // While typing: the number so far (a half-typed one, e.g. "1.", is left
  // alone in the field).
  typed(target: EventTarget | null) {
    const text = (target as HTMLInputElement).value;
    if (text === "") return;
    const n = this.clamp(text);
    if (n !== this.value) {
      this.value = n;
      this.onChange(n);
    }
  }

  // Leaving the field: it shows the number it holds.
  settle(target: EventTarget | null) {
    const input = target as HTMLInputElement;
    const n = this.clamp(input.value);
    input.value = String(n);
    if (n !== this.value) {
      this.value = n;
      this.onChange(n);
    }
    this.onTouched();
  }

  writeValue(value: unknown): void {
    this.value =
      value === null || value === undefined || value === ""
        ? null
        : this.clamp(value);
    this.changeRef.markForCheck();
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
