import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Renderer2,
  ElementRef,
  RendererStyleFlags2
} from "@angular/core";
import { ActivatedRoute, Router, RouterLinkActive } from "@angular/router";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import { UserExceptions, SelectItem, AppSettings } from "../../models";
import { UserExceptionsService, LoggerService, SettingsService } from "../services";
import { Subscription } from "rxjs";
import { APP } from "../../variables";
import * as _ from "lodash";

@Component({
  selector: "user-exceptions",
  templateUrl: "../templates/user-exceptions.component.html",
  styleUrls: ["../styles/user-exceptions.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionsComponent implements OnDestroy {
  currentDoc: { activePath: string; content: string } = {
    activePath: "",
    content: "",
  };
  appSettings: AppSettings;
  exceptionsForm: FormGroup;
  filterValue = "";
  private subscriptions: Subscription = new Subscription();
  private userExceptions: UserExceptions;
  showMarkdown: boolean = false;

  sortByOpts: SelectItem[] = _.flatten(
    [
      { value: "timeStamp", displayValue: "Date Added" },
      { value: "oldTitle", displayValue: "Extracted Title" },
      { value: "newTitle", displayValue: "New Title" },
    ].map((x) => [
      { value: x.value + "|asc", displayValue: x.displayValue + " (asc)" },
      { value: x.value + "|desc", displayValue: x.displayValue + " (desc)" },
    ]),
  );

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private exceptionsService: UserExceptionsService,
    private loggerService: LoggerService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private renderer:  Renderer2,
    private elementRef: ElementRef,
    private settingsService: SettingsService
  ) {
    this.appSettings = this.settingsService.getSettings();
    this.currentDoc.content = this.lang.docs__md.userExceptions.join("");
  }

  get lang() {
    return APP.lang.userExceptions.component;
  }

  get isUnsaved() {
    return this.exceptionsService.isUnsaved;
  }

  get sortBy() {
    return this.exceptionsService.sortBy;
  }

  set sortBy(sortBy: string) {
    this.exceptionsService.sortBy = sortBy;
  }

  get exceptionsFormItems() {
    return this.exceptionsForm.get("items") as FormArray;
  }

  exceptionsInfoClick() {
    this.currentDoc.content = this.lang.docs__md.userExceptions.join("");
  }

  save() {
    this.exceptionsService.saveUserExceptions();
  }

  deleteAll() {
    while (this.exceptionsFormItems.length > 0) {
      this.exceptionsFormItems.removeAt(0);
    }
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      oldTitle: "",
      newTitle: "",
      searchTitle: "",
      commandLineArguments: "",
      timeStamp: Date.now(),
      exclude: false,
      excludeArtwork: false,
    });
  }

  setForm() {
    this.exceptionsForm = this.formBuilder.group({
      items: this.formBuilder.array(
        Object.entries(this.userExceptions.titles).map((e) =>
          this.formBuilder.group(Object.assign({ oldTitle: e[0] }, e[1])),
        ),
      ),
    });
    this.exceptionsForm.valueChanges.subscribe((val: any) => {
      this.exceptionsService.setIsUnsaved(true);
      let error = this.exceptionsService.setCurrent({
        exceptionsVersion: this.userExceptions.exceptionsVersion,
        titles:
          Object.fromEntries(
            val.items
              .filter((item: any) => item.oldTitle)
              .map((item: any) => [item.oldTitle, _.omit(item, "oldTitle")]),
          ) || {},
      });
    });
  }

  exceptionsSort(c1: FormGroup, c2: FormGroup) {
    const sortBy = this.sortBy.split("|")[0];
    const asc = this.sortBy.split("|")[1] === "asc";
    let result: number;
    if (!sortBy || sortBy === "timeStamp") {
      result = c1.value.timeStamp - c2.value.timeStamp;
    } else {
      result = c1.value[sortBy].localeCompare(c2.value[sortBy]);
    }
    return asc ? result : -result;
  }

  prettyDate(timeStamp: number) {
    const date = new Date(timeStamp);
    return date.toLocaleString();
  }

  undo() {
    this.exceptionsService.setIsUnsaved(false);
    this.exceptionsService.setCurrent(null);
  }

  addItem() {
    this.exceptionsFormItems.push(this.createItem());
  }
  deleteItem(index: number) {
    this.exceptionsFormItems.removeAt(index);
  }

  openDocs() {
    this.showMarkdown = true;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--markdown-width",
      "1fr",
      RendererStyleFlags2.DashCase,
    );
  }
  closeDocs() {
    this.showMarkdown = false;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--markdown-width",
      "0fr",
      RendererStyleFlags2.DashCase,
    );
  }

  ngOnInit() {
    this.exceptionsService.setIsUnsaved(false);
    this.subscriptions.add(
      this.exceptionsService.dataObservable.subscribe((data) => {
        this.userExceptions = data.current ? data.current : data.saved;
        if (!this.exceptionsService.isUnsaved) {
          this.setForm();
        }
        if (data.current) {
          this.exceptionsService.setIsUnsaved(true);
        } else {
          this.exceptionsService.setIsUnsaved(false);
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
