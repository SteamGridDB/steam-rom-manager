import {
  Component,
  forwardRef,
  ElementRef,
  HostListener,
  Input,
  ChangeDetectorRef,
  ViewChild,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";

// A single-value select that also accepts free text: pick an existing option
// from the dropdown or type a new value. The control value is always a string.
@Component({
  selector: "ng-combo-box",
  template: `
    <div class="display" [class.open]="open">
      <input
        #input
        type="text"
        spellcheck="false"
        [placeholder]="placeholder"
        [value]="text"
        [disabled]="disabled"
        (input)="onInput($any($event.target).value)"
        (focus)="openList()"
        (click)="openList()"
        (keydown)="onKeydown($event)"
      />
      <span
        class="clear"
        *ngIf="text && !disabled"
        (mousedown)="$event.preventDefault(); clear()"
        >&times;</span
      >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="0 0 300 300"
        (mousedown)="$event.preventDefault(); toggle()"
      >
        <polyline points="70, 110 150, 200 230, 110" />
      </svg>
    </div>
    <div class="options" [class.open]="open && !disabled">
      <ng-option
        text-scroll
        *ngFor="let option of visibleOptions; let i = index"
        [displayValue]="option"
        [isSelected]="option === text"
        [class.highlighted]="i === highlighted"
        (mousedown)="$event.preventDefault(); pick(option)"
      >
        {{ option }}
      </ng-option>
      <div
        *ngIf="showCreate"
        text-scroll
        class="fakeOption create"
        [class.highlighted]="highlighted === visibleOptions.length"
        (mousedown)="$event.preventDefault(); pick(text.trim())"
      >
        {{ createLabel }} "{{ text.trim() }}"
      </div>
      <div
        *ngIf="!visibleOptions.length && !showCreate"
        text-scroll
        class="fakeOption"
      >
        {{ emptyLabel }}
      </div>
    </div>
  `,
  styleUrls: ["../styles/ng-combo-box.component.scss"],
  host: { "[class.open]": "open" },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgComboBoxComponent),
      multi: true,
    },
  ],
})
export class NgComboBoxComponent implements ControlValueAccessor {
  @Input() placeholder: string = "";
  @Input() createLabel: string = "Create";
  @Input() emptyLabel: string = "No options";
  @Input() set values(values: string[]) {
    this.options = (values || []).filter((v) => !!v);
    this.changeRef.markForCheck();
  }
  @ViewChild("input") private inputRef: ElementRef<HTMLInputElement>;

  options: string[] = [];
  text: string = "";
  open: boolean = false;
  disabled: boolean = false;
  highlighted: number = -1;
  // Only filter after the user types; opening the list shows every option.
  private filtering: boolean = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(
    private element: ElementRef,
    private changeRef: ChangeDetectorRef,
  ) {}

  get visibleOptions() {
    const term = this.text.trim().toLowerCase();
    if (!this.filtering || !term) return this.options;
    return this.options.filter((o) => o.toLowerCase().includes(term));
  }

  get showCreate() {
    const trimmed = this.text.trim();
    return !!trimmed && !this.options.includes(trimmed);
  }

  private get itemCount() {
    return this.visibleOptions.length + (this.showCreate ? 1 : 0);
  }

  openList() {
    if (this.disabled || this.open) return;
    this.open = true;
    this.filtering = false;
    this.highlighted = this.visibleOptions.indexOf(this.text.trim());
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.highlighted = -1;
    // Normalize what's displayed to the committed (trimmed) value.
    this.text = this.text.trim();
    this.onTouched();
  }

  toggle() {
    if (this.open) {
      this.close();
    } else {
      this.inputRef.nativeElement.focus();
      this.openList();
    }
  }

  onInput(value: string) {
    this.text = value;
    this.filtering = true;
    this.open = true;
    this.highlighted = this.itemCount ? 0 : -1;
    this.emit();
  }

  pick(value: string) {
    this.text = value;
    this.emit();
    this.close();
  }

  clear() {
    this.text = "";
    this.filtering = false;
    this.emit();
    this.inputRef.nativeElement.focus();
    this.open = true;
  }

  onKeydown(event: KeyboardEvent) {
    const count = this.itemCount;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!this.open) this.openList();
        else if (count) this.highlighted = (this.highlighted + 1) % count;
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!this.open) this.openList();
        else if (count)
          this.highlighted = (this.highlighted - 1 + count) % count;
        break;
      case "Enter":
        event.preventDefault();
        if (this.open && this.highlighted >= 0) {
          const visible = this.visibleOptions;
          this.pick(
            this.highlighted < visible.length
              ? visible[this.highlighted]
              : this.text.trim(),
          );
        } else {
          this.close();
        }
        break;
      case "Escape":
        this.close();
        break;
      case "Tab":
        this.close();
        break;
    }
  }

  private emit() {
    this.onChange(this.text.trim());
  }

  writeValue(value: any): void {
    this.text = typeof value === "string" ? value : "";
    this.filtering = false;
    this.changeRef.markForCheck();
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.close();
    this.changeRef.markForCheck();
  }

  @HostListener("document:mousedown", ["$event"])
  onDocumentMousedown(event: MouseEvent) {
    if (
      this.open &&
      !(<HTMLElement>this.element.nativeElement).contains(<Node>event.target)
    ) {
      this.close();
    }
  }
}
