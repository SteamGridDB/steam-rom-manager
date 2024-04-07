import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import { ParsersService, LanguageService, UserExceptionsService, SettingsService } from "../services";
import { UserConfiguration, AppSettings } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";

import {
  p3do,
  ags,
  amiga,
  amiga600,
  amiga1200,
  amigacd,
  amigacd32,
  amstradcpc,
  android,
  apple2,
  apple2gs,
  arcade,
  arcadefbneo,
  astrocade,
  atari800,
  atari2600,
  atari5200,
  atari7800,
  atarijaguar,
  atarijaguarcd,
  atarilynx,
  atarist,
  atarixe,
  atomiswave,
  bandaiwonderswan,
  bandaiwonderswancolor,
  bbcmicro,
  benesse,
  cavestory,
  cdimono1,
  cdtv,
  chailove,
  channelf,
  cloudservices,
  coco,
  colecocolecovision,
  colecovision,
  commodore16,
  commodore64,
  commodorevic20,
  cps,
  daphne,
  desktop,
  doom,
  dos,
  dragon32,
  easyrpg,
  emulators,
  epic,
  esde,
  famicom,
  fba,
  fds,
  flash,
  fmtowns,
  gameandwatch,
  gx4000,
  intellivision,
  j2me,
  kodi,
  lutris,
  lutro,
  macintosh,
  mame,
  megacd,
  megacdjp,
  megadrive,
  megaduck,
  mess,
  microsoftmsx1,
  microsoftmsx2,
  microsoftxbox,
  microsoftxbox360,
  model2,
  model3,
  moonlight,
  moto,
  msx,
  msx1,
  msx2,
  msxturbor,
  mugen,
  multivision,
  n64dd,
  naomi,
  naomigd,
  nec,
  necpc98,
  necpcenginesupergrafx,
  necpcengineturbografx16,
  necpcengineturbografx16cd,
  neogeo,
  neogeocd,
  neogeocdjp,
  ngp,
  nintendo3ds,
  nintendo64,
  nintendo64dd,
  nintendods,
  nintendoentertainmentsystem,
  nintendofamicomdisksystem,
  nintendogameboy,
  nintendogameboyadvance,
  nintendogameboycolor,
  nintendogamecube,
  nintendometroidprimetrilogy,
  nintendones,
  nintendosnes,
  nintendosnessupernintendo,
  nintendosupergameboy,
  nintendosnessupernintendohd,
  nintendosneswidescreen,
  nintendoswitch,
  nintendoswitchryujinx,
  nintendovirtualboy,
  nintendowii,
  nintendowiiu,
  odyssey2,
  openbor,
  oric,
  palm,
  panasonic3do,
  pc,
  pc88,
  pcengineturbografx16,
  pceturbografx16,
  pceturbografx16cd,
  pcfx,
  philipscdi,
  pico8,
  pokemini,
  ports,
  primehack,
  remoteplayclients,
  rpgmaker,
  samcoupe,
  satellaview,
  saturnjp,
  scummvm,
  scummvmstandalone,
  sega32x,
  sega32xjp,
  sega32xna,
  segacdmegacd,
  segadreamcast,
  segagamegear,
  segagenesismegadrive,
  segagenesismegadrivewidescreen,
  segamastersystem,
  segasaturn,
  segasg1000,
  sfc,
  sg1000,
  sgb,
  sharpx68000,
  sinclairzxspectrum,
  snkneogeocd,
  snkneogeopocket,
  snkneogeopocketares,
  snkneogeopocketcolor,
  solarus,
  sonyplaystation,
  sonyplaystation2,
  sonyplaystation3,
  sonyplaystation4,
  sonyplaystationportable,
  sonyplaystationvita,
  sonyplaystationvitainstalledpkg,
  sonypsvita,
  spectravideo,
  steam,
  stratagus,
  sufami,
  supergrafx,
  supervision,
  symbian,
  tanodragon,
  tg16,
  tgcd,
  ti99,
  tic80,
  tigerelectronicsgamecom,
  to8,
  trs80,
  uzebox,
  vectrex,
  videopac,
  vtechvsmile,
  wonderswancolor,
  x1,
  zmachine,
  zx81,
  zxspectrum,
  pegasus,
  segamodel3,
	segamodel2
} from "../../systems-logos"

const importMap: { [key: string]: any[] } = {
  odyssey2,
  primehack,
  nintendoswitch,
  multivision,
  nintendo64dd,
  mugen,
  philipscdi,
  ports,
  nintendometroidprimetrilogy,
  nintendoentertainmentsystem,
  necpcenginesupergrafx,
  palm,
  pcfx,
  necpcengineturbografx16cd,
  nintendosneswidescreen,
  sega32x,
  nintendogameboy,
  nintendogameboyadvance,
  nintendowiiu,
  pico8,
  remoteplayclients,
  nintendosnessupernintendo,
  nintendosupergameboy,
  nintendowii,
  nintendo3ds,
  scummvmstandalone,
  pc,
  naomi,
  nintendods,
  panasonic3do,
  nintendosnessupernintendohd,
  neogeo,
  openbor,
  nintendones,
  pokemini,
  samcoupe,
  satellaview,
  neogeocdjp,
  oric,
  pcengineturbografx16,
  neogeocd,
  nec,
  nintendovirtualboy,
  nintendogameboycolor,
  n64dd,
  ngp,
  msx1,
  msx,
  msxturbor,
  nintendoswitchryujinx,
  pc88,
  pceturbografx16cd,
  naomigd,
  necpcengineturbografx16,
  msx2,
  nintendogamecube,
  nintendosnes,
  rpgmaker,
  nintendo64,
  nintendofamicomdisksystem,
  saturnjp,
  necpc98,
  scummvm,
  pceturbografx16,
  atari800,
  cloudservices,
  atari2600,
  amigacd32,
  commodore64,
  megacd,
  cdtv,
  j2me,
  atari5200,
  channelf,
  chailove,
  megacdjp,
  atari7800,
  gameandwatch,
  cps,
  daphne,
  atomiswave,
  zxspectrum,
  coco,
  lutris,
  x1,
  astrocade,
  amiga1200,
  megadrive,
  commodorevic20,
  lutro,
  p3do,
  amiga600,
  amstradcpc,
  epic,
  easyrpg,
  famicom,
  emulators,
  fba,
  arcade,
  arcadefbneo,
  macintosh,
  dragon32,
  esde,
  commodore16,
  dos,
  ags,
  cdimono1,
  desktop,
  doom,
  megaduck,
  mess,
  intellivision,
  fmtowns,
  colecovision,
  flash,
  fds,
  atarixe,
  cavestory,
  zmachine,
  kodi,
  apple2gs,
  atarilynx,
  amiga,
  colecocolecovision,
  bbcmicro,
  apple2,
  atarist,
  amigacd,
  benesse,
  atarijaguar,
  bandaiwonderswan,
  bandaiwonderswancolor,
  zx81,
  android,
  gx4000,
  mame,
  atarijaguarcd,
  microsoftxbox,
  moto,
  microsoftmsx2,
  moonlight,
  microsoftxbox360,
  model3,
  model2,
  microsoftmsx1,
  segadreamcast,
  segamastersystem,
  solarus,
  segagenesismegadrive,
  segagamegear,
  segagenesismegadrivewidescreen,
  sonypsvita,
  segasg1000,
  sonyplaystation3,
  sfc,
  snkneogeopocket,
  sgb,
  snkneogeocd,
  sharpx68000,
  sonyplaystation,
  snkneogeopocketares,
  sonyplaystation4,
  sonyplaystation2,
  snkneogeopocketcolor,
  sonyplaystationvitainstalledpkg,
  spectravideo,
  sega32xna,
  sonyplaystationvita,
  sonyplaystationportable,
  sega32xjp,
  tanodragon,
  steam,
  sinclairzxspectrum,
  stratagus,
  sufami,
  segacdmegacd,
  segasaturn,
  sg1000,
  supergrafx,
  supervision,
  symbian,
  tgcd,
  tg16,
  ti99,
  tic80,
  tigerelectronicsgamecom,
  to8,
  trs80,
  uzebox,
  vectrex,
  videopac,
  vtechvsmile,
  wonderswancolor,
  pegasus,
  segamodel3,
  segamodel2
}

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

        const peep = (importName: string) => {
           if (importName in importMap) {
             const arrayMap: any[] = importMap[importName];
            return arrayMap
          } else {
            // Puedes manejar el caso en el que el nombre no coincide con ninguna importación
            return null; // O devuelve un valor predeterminado, lanza una excepción, etc.
          }
        };

        this.userConfigurations = userConfigurations.map(
          (config: { saved: UserConfiguration; current: UserConfiguration, name: string; restText: string }, index: number, array: any[]) => {
            let separatedValues: any = config.saved.configTitle.split(" - ");
            let separatedValuesImg = separatedValues[0].replaceAll(" ", "");
            separatedValuesImg = separatedValuesImg.replaceAll("/", "-");
            separatedValuesImg = separatedValuesImg.replaceAll("/", "-");
            separatedValuesImg = separatedValuesImg.replaceAll("-", "");
            separatedValuesImg = separatedValuesImg.replaceAll("(", "");
            separatedValuesImg = separatedValuesImg.replaceAll(")", "");
            separatedValuesImg = separatedValuesImg.replaceAll(".", "");
            separatedValuesImg = separatedValuesImg.replaceAll("3do", "p3do");
            separatedValuesImg = separatedValuesImg.toLowerCase();

            let imgPath = peep(separatedValuesImg)
            let previousSeparatedValuesImg: any

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

        // console.log(this.userConfigurations);

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
