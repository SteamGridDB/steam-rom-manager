import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import {
  ParsersService,
  LanguageService,
  UserExceptionsService,
  SettingsService,
} from "../services";
import { UserConfiguration, AppSettings } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";

@Component({
  selector: "nav-parsers",
  templateUrl: "../templates/nav-parsers.component.html",
  styleUrls: ["../styles/nav-parsers.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavParsersComponent implements OnDestroy {
  userConfigurations: {
    saved: UserConfiguration;
    current: UserConfiguration;
  }[];
  isExceptionsUnsaved: boolean = false;
  navForm: FormGroup;
  imageMap: { [k: string]: any } = {};
  private subscriptions: Subscription = new Subscription();
  private appSettings: AppSettings;

  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private settingsService: SettingsService,
    private changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {}

  get lang() {
    return APP.lang.nav.component;
  }
  ngOnInit() {
    this.appSettings = this.settingsService.getSettings();
    this.subscriptions.add(
      this.parsersService
        .getUserConfigurations()
        .subscribe((userConfigurations) => {
          for (let userConfiguration of userConfigurations) {
            let separatedValues: string[] =
              userConfiguration.saved.configTitle.split(" - ");
            let separatedValuesImg = separatedValues.length
              ? separatedValues[0].replaceAll(/[\/\-\(\)\.\s]/g, "")
              : "";
            separatedValuesImg = separatedValuesImg
              .replaceAll("3do", "p3do")
              .toLowerCase();
            let imgValue = "";
            let alternativeValue = false;
            let detailsValue = "";
            try {
              imgValue = require(
                `../../assets/systems/${separatedValuesImg}.svg`,
              );
              detailsValue = userConfiguration.saved.configTitle
                .split(" - ")
                .slice(1)
                .join(" - ");
            } catch (e) {
              alternativeValue = true;
              detailsValue = userConfiguration.saved.configTitle;
            }
            this.imageMap[userConfiguration.saved.parserId] = {
              alternative: alternativeValue,
              details: detailsValue,
              img: imgValue,
            };
          }
          this.userConfigurations = userConfigurations;

          let someOn: boolean = userConfigurations.length
            ? userConfigurations
                .map((config) => !config.saved.disabled)
                .reduce((x, y) => x || y)
            : false;
          this.navForm = this.formBuilder.group({
            selectAll: someOn,
            parserStatuses: this.formBuilder.array(
              this.userConfigurations.map(
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

          this.getParserControls().forEach((control: FormGroup) => {
            control.valueChanges.subscribe(
              (val: { [parserId: string]: boolean }) => {
                this.parsersService.changeEnabledStatus(
                  Object.keys(val)[0],
                  Object.values(val)[0],
                );
              },
            );
          });

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

  flipAll() {
    this.navForm
      .get("selectAll")
      .setValue(!this.navForm.get("selectAll").value);
  }

  getParserControls() {
    return (this.navForm.get("parserStatuses") as FormArray)
      .controls as FormGroup[];
  }

  emuClick(control: FormControl) {
    if (this.appSettings.theme == "EmuDeck") {
      control.setValue(!control.value);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
