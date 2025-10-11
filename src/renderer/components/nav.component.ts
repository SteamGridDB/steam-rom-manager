import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Output,
  Input,
} from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import {
  ParsersService,
  LanguageService,
  UserExceptionsService,
} from "../services";
import { UserConfiguration } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";
import { EventEmitter } from "@angular/core";

@Component({
  selector: "nav",
  templateUrl: "../templates/nav.component.html",
  styleUrls: ["../styles/nav.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent implements OnDestroy {
  isExceptionsUnsaved: boolean = false;
  private userConfigurations: {
    saved: UserConfiguration;
    current: UserConfiguration;
  }[];

  private subscriptions: Subscription = new Subscription();

  private navForm: FormGroup;

  @Input() navClick: EventEmitter<any>;

  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {}

  get lang() {
    return APP.lang.nav.component;
  }

  ngOnInit() {
    this.subscriptions.add(
      this.parsersService
        .getUserConfigurations()
        .subscribe((userConfigurations) => {
          this.userConfigurations = userConfigurations;
          let someOn: boolean = userConfigurations.length
            ? userConfigurations
                .map((config) => !config.saved.disabled)
                .reduce((x, y) => x || y)
            : false;
          this.navForm = this.formBuilder.group({
            selectAll: someOn,
            parserStatuses: this.formBuilder.array(
              userConfigurations.map(
                (config: {
                  saved: UserConfiguration;
                  current: UserConfiguration;
                }) => {
                  let singleton: { [k: string]: boolean } = {};
                  singleton[config.saved.parserId] = !config.saved.disabled;
                  return this.formBuilder.group(singleton);
                },
              ),
            ),
          });
          this.navForm
            .get("selectAll")
            .valueChanges.subscribe((val: boolean) => {
              if (
                !val ||
                this.userConfigurations
                  .map((config) => config.saved.disabled)
                  .reduce((x, y) => x && y)
              ) {
                this.parsersService.changeEnabledStatusAll(val);
              }
            });
          (this.navForm.get("parserStatuses") as FormArray).controls.forEach(
            (control: FormControl) => {
              control.valueChanges.subscribe(
                (val: { [parserId: string]: boolean }) => {
                  this.parsersService.changeEnabledStatus(
                    Object.keys(val)[0],
                    Object.values(val)[0],
                  );
                },
              );
            },
          );
          this.changeRef.detectChanges();
        }),
    );
    this.subscriptions.add(
      this.exceptionsService.isUnsavedObservable.subscribe((val: boolean) => {
        this.isExceptionsUnsaved = val;
        this.changeRef.detectChanges();
      }),
    );
    this.languageService.observeChanges().subscribe((lang) => {
      this.changeRef.detectChanges();
    });
  }

  getParserControls() {
    return (this.navForm.get("parserStatuses") as FormArray).controls;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
