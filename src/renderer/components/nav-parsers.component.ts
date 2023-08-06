import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import { ParsersService, LanguageService, UserExceptionsService, SettingsService } from "../services";
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
  private userConfigurations: {
    saved: UserConfiguration;
    current: UserConfiguration;
    name: string;
    restText: string;
  }[];
  private numConfigurations: number = -1;
  private isExceptionsUnsaved: boolean = false;
  private dummy: boolean = true;
  private subscriptions: Subscription = new Subscription();
  private appSettings: AppSettings;
  private navForm: FormGroup;
  private navFormItems: FormArray;

  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private settingsService: SettingsService,
    private changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.appSettings = this.settingsService.getSettings();
    this.subscriptions.add(
      this.parsersService.getUserConfigurations().subscribe((userConfigurations) => {
        this.numConfigurations = userConfigurations.length;
        let alternativeValue = false;
        let previousSeparatedValuesImg = false;
        this.userConfigurations = userConfigurations.map(
          (config: { saved: UserConfiguration; current: UserConfiguration }, index: number, array: any[]) => {
            let separatedValues = config.saved.configTitle.split(" - ");
            let separatedValuesImg = separatedValues[0].replaceAll(" ", "");
            separatedValuesImg = separatedValuesImg.replaceAll("/", "-");
            let imgPath = `../../src/assets/systems/${separatedValuesImg}/images/logo.svg`;
            imgPath = imgPath.toLowerCase();
            if (previousSeparatedValuesImg === false) {
              previousSeparatedValuesImg = separatedValuesImg;
            } else {
              if (previousSeparatedValuesImg === separatedValuesImg) {
                alternativeValue = true;
              } else {
                alternativeValue = false;
              }
            }

            previousSeparatedValuesImg = separatedValuesImg;
            let parserDetails = separatedValues.slice(1).join(" - ");
            parserDetails = parserDetails.replaceAll("-", "<br/>");
            return {
              ...config,
              saved: {
                ...config.saved,
                alternative: alternativeValue,
                name: separatedValues[0],
                details: parserDetails,
                img: imgPath,
              },
            };
          }
        );

        console.log(this.userConfigurations);

        let someOn: boolean = userConfigurations.length
          ? userConfigurations.map((config) => !config.saved.disabled).reduce((x, y) => x || y)
          : false;
        this.navForm = this.formBuilder.group({
          selectAll: someOn,
          parserStatuses: this.formBuilder.array(
            userConfigurations.map((config: { saved: UserConfiguration; current: UserConfiguration }) => {
              let singleton: { [k: string]: boolean } = {};
              singleton[config.saved.parserId] = !config.saved.disabled;
              return this.formBuilder.group(singleton);
            })
          ),
        });

        this.navForm.get("selectAll").valueChanges.subscribe((val: boolean) => {
          if (!val || this.userConfigurations.map((config) => config.saved.disabled).reduce((x, y) => x && y)) {
            this.parsersService.changeEnabledStatusAll(val);
          }
        });

        this.getParserControls().forEach((control: FormControl) => {
          control.valueChanges.subscribe((val: { [parserId: string]: boolean }) => {
            this.parsersService.changeEnabledStatus(Object.keys(val)[0], Object.values(val)[0]);
          });
        });

        this.changeRef.detectChanges();
      })
    );

    this.subscriptions.add(
      this.exceptionsService.isUnsavedObservable.subscribe((val: boolean) => {
        this.isExceptionsUnsaved = val;
        this.refreshActiveRoute();
        this.changeRef.detectChanges();
      })
    );

    this.languageService.observeChanges().subscribe((lang) => {
      this.changeRef.detectChanges();
    });
  }

  private flipAll() {
    this.navForm.get("selectAll").setValue(!this.navForm.get("selectAll").value);
  }

  private refreshActiveRoute() {
    this.dummy = !this.dummy;
  }

  private get lang() {
    return APP.lang.nav.component;
  }

  getParserControls() {
    return (this.navForm.get("parserStatuses") as FormArray).controls;
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
