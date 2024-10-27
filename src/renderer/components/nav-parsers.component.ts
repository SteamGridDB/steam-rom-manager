import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  EventEmitter,
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
import { Router } from "@angular/router";

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
  appSettings: AppSettings;
  dragStartIndex: number = -1;
  currentId: string = "";
  @Input() navClick: EventEmitter<any>;
  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private router: Router,
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
          if(this.appSettings.theme == "EmuDeck") {
            this.initializeImageMap(userConfigurations)
          }
          this.userConfigurations = userConfigurations;

          let someOn: boolean = userConfigurations.length
            ? userConfigurations
                .map((config) => !config.saved.disabled)
                .reduce((x, y) => x || y)
            : false;
          this.navForm = this.formBuilder.group({
            selectAll: someOn,
            parserStatuses: this.formBuilder.group(
              Object.fromEntries(this.userConfigurations.map((config: {saved: UserConfiguration, current: UserConfiguration}) => {
                return [config.saved.parserId, !config.saved.disabled]
              }))
            )
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
          const parserControls = this.getParserControls();
          for(let userConfiguration of this.userConfigurations) {
            let parserId = userConfiguration.saved.parserId;
            parserControls[parserId].valueChanges.subscribe((val: boolean)=>{
              this.parsersService.changeEnabledStatus(parserId, val);
            })
          }

          this.changeRef.detectChanges();
        }),
    );

    this.subscriptions.add(
      this.exceptionsService.isUnsavedObservable.subscribe((val: boolean) => {
        this.isExceptionsUnsaved = val;
        this.changeRef.detectChanges();
      }),
    );
    if(this.appSettings.theme == 'Deck') {
      this.subscriptions.add(
        this.navClick.subscribe(()=>{
          this.currentId="";
          this.changeRef.detectChanges();
        })
      )
    }

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
    return (this.navForm.get("parserStatuses") as FormGroup).controls;
  }

  emuClick(control: FormControl) {
    control.setValue(!control.value);
  }

  onClick(index: number, parserId: string) {
    this.router.navigate(["/parsers", index]);
    this.currentId = parserId;
  }

  getRouteIndex(route: string) {
    return parseInt(route.split("/")[2])
  }

  dragStart(event: Event) {
    this.dragStartIndex = this.getRouteIndex(this.router.url);
  }

  handleDrop(fromIndex: number, toIndex:number) {
    this.parsersService.injectIndex(fromIndex, toIndex);
    if(fromIndex < this.dragStartIndex && this.dragStartIndex <= toIndex) {
      this.router.navigate(["/parsers", this.dragStartIndex - 1])
    } else if(toIndex <= this.dragStartIndex && this.dragStartIndex < fromIndex) {
      this.router.navigate(["/parsers", this.dragStartIndex + 1])
    } else if(this.dragStartIndex==fromIndex) {
      this.router.navigate(["/parsers", toIndex])
    }
  }

  initializeImageMap(userConfigurations: {current: UserConfiguration, saved: UserConfiguration}[]) {
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
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
