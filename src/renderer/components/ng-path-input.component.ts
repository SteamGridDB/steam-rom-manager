import {
  Component,
  forwardRef,
  ElementRef,
  Input,
  Output,
  ViewChild,
  HostListener,
  EventEmitter,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
const { dialog } = require("@electron/remote");
const { BrowserWindow } = require("@electron/remote");

@Component({
  selector: "ng-path-input",
  template: `
    <ng-content></ng-content>
    <input style="display: none" #fileInput type="text" (click)="browse()" />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgPathInputComponent),
      multi: true,
    },
  ],
})
export class NgPathInputComponent implements ControlValueAccessor {
  @ViewChild("fileInput", { read: ElementRef })
  private fileInput: ElementRef;
  private currentValue: string = null;
  private onChange = (_: any) => {};
  private onTouched = () => {};

  @Input() private directory: boolean = false;
  @Input() private stateless: boolean = false;
  @Output() private pathChange: EventEmitter<string> = new EventEmitter();

  constructor() {}

  @HostListener("click")
  onClick() {
    if (this.fileInput && this.fileInput.nativeElement) {
      let fileInput = <HTMLInputElement>this.fileInput.nativeElement;
      fileInput.click();
    }
  }
  browse() {
    let title = "Select a ".concat(this.directory ? "folder" : "file");
    let buttonLabel = "Select ".concat(this.directory ? "folder" : "file");
    let properties = [
      this.directory ? "openDirectory" : "openFile",
      "showHiddenFiles",
    ];
    dialog
      .showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: title,
        properties: properties,
        buttonLabel: buttonLabel,
      } as Electron.OpenDialogOptions)
      .then((result: any) => {
        if (
          result &&
          !result.canceled &&
          result.filePaths &&
          result.filePaths.length == 1
        ) {
          this.writeValue("_browse_&:&".concat(result.filePaths[0]));
        }
      });
  }

  @Input()
  set value(value: string) {
    this.writeValue(value);
  }

  get value() {
    return this.currentValue;
  }

  writeValue(value: any): void {
    let oldValue = this.currentValue;
    if (value && value !== oldValue) {
      this.currentValue = this.stateless ? null : value;
      this.onChange(value);
      this.pathChange.emit(value);
    }

    this.onTouched();
  }

  registerOnChange(fn: (value: any) => any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => any): void {
    this.onTouched = fn;
  }
}
