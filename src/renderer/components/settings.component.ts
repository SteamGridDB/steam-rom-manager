import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Renderer2,
  RendererStyleFlags2,
  ElementRef,
} from "@angular/core";
import {
  SettingsService,
  ParsersService,
  PreviewService,
  LanguageService,
  ImageProviderService,
  FuzzyService,
  CustomVariablesService,
  ConfigurationPresetsService,
  ShellScriptsService,
  LoggerService,
} from "../services";
import { APP } from "../../variables";
import { AppSettings, SelectItem } from "../../models";
import { Subscription } from "rxjs";
import { ThemeService } from "../theme/theme.service";
import { CoreClientService } from "../services/core-client.service";
import {
  providersSelect,
  dnsSelect,
  loadStrategiesSelect,
} from "../../lib/image-providers/available-providers";

@Component({
  selector: "settings",
  templateUrl: "../templates/settings.component.html",
  styleUrls: ["../styles/settings.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnDestroy {
  currentDoc: { activePath: string; content: string } = {
    activePath: "",
    content: "",
  };
  settings: AppSettings;
  availableBatches: { displayValue: string; value: number }[];
  themes: string[];
  themeSections: Record<string, string> = {};
  availableLanguages: SelectItem[];
  knownSteamDirectories: string[];
  placeholderForOS: {
    steamDirectory: string;
    romsDirectory: string;
    retroarchPath: string;
    raCoresDirectory: string;
    localImagesDirectory: string;
  };
  userAccountsPlaceholder: string;
  chooseUserAccountsVisible: boolean = false;
  showShellScripts: boolean = false;
  showMarkdown: boolean = false;
  tab: "settings" | "themeEditor" = "settings";
  private subscriptions: Subscription = new Subscription();
  constructor(
    private settingsService: SettingsService,
    private fuzzyService: FuzzyService,
    private languageService: LanguageService,
    private loggerService: LoggerService,
    private previewService: PreviewService,
    private parsersService: ParsersService,
    public cpService: ConfigurationPresetsService,
    public cvService: CustomVariablesService,
    public ssService: ShellScriptsService,
    private changeDetectionRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private coreClient: CoreClientService,
    private themeService: ThemeService,
  ) {
    this.currentDoc.content = this.lang.docs__md.settings.join("");
  }

  get availableProviders() {
    return providersSelect;
  }

  get availableDNS() {
    return dnsSelect;
  }

  get availableLoadStrategies() {
    return loadStrategiesSelect;
  }

  get lang() {
    return APP.lang.settings.component;
  }

  ngOnInit() {
    this.subscriptions.add(
      this.settingsService.getChangeObservable().subscribe(() => {
        this.changeDetectionRef.detectChanges();
        this.knownSteamDirectories =
          this.parsersService.getKnownSteamDirectories();
      }),
    );
    this.knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    this.subscriptions.add(
      this.parsersService.getUserConfigurations().subscribe(() => {
        this.knownSteamDirectories =
          this.parsersService.getKnownSteamDirectories();
      }),
    );
    this.settings = this.settingsService.getSettings();
    this.availableBatches = [10, 20, 50, 100, 200, 500].map((x) => {
      return { value: x, displayValue: x.toString() };
    });
    this.availableLanguages = this.languageService
      .getAvailableLanguages()
      .map((lang) => {
        return {
          value: lang,
          displayValue: this.languageService.getReadableName(lang),
        };
      });
    this.listThemes();
    // pick up user themes added since start-up
    this.themeService.loadUserThemes().then(() => {
      this.listThemes();
      this.changeDetectionRef.markForCheck();
    });
    this.userAccountsPlaceholder = this.lang.placeholder.userAccounts;
    this.placeholderForOS = this.lang.placeholder.bySystem[APP.osType];
  }

  setTab(tab: "settings" | "themeEditor") {
    this.tab = tab;
    if (tab === "themeEditor") this.closeDocs();
  }

  // App themes, then the user's (userData/themes/user), in sections.
  listThemes() {
    const { appThemeNames, userThemeNames } = this.themeService;
    this.themes = [...appThemeNames, ...userThemeNames];
    this.themeSections = Object.fromEntries([
      ...appThemeNames.map((name) => [name, this.lang.text.appThemes]),
      ...userThemeNames.map((name) => [name, this.lang.text.userThemes]),
    ]);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSettingsChange(detectChanges: boolean = true) {
    if (detectChanges) this.settingsService.settingsChanged();
    this.settingsService.saveAppSettings();
  }

  async nukeArtworkChoices() {
    try {
      await this.coreClient.client.call("support", "clearArtworkCache");
      this.loggerService.info(this.lang.info.emptiedArtworkCache, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
    } catch (e) {
      this.coreClient.logError(e);
    }
  }

  async nukeArtworkBackups() {
    try {
      await this.coreClient.client.call("support", "clearArtworkBackups");
      this.loggerService.info(this.lang.info.nukedArtworkBackups, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
    } catch (e) {
      this.coreClient.logError(e);
    }
  }

  removeApps() {
    return this.previewService.removeAllAdded();
  }

  removeControllersOnly() {
    return this.parsersService.removeAllControllers();
  }

  resetFuzzy() {
    this.fuzzyService.fuzzyLoader.resetList();
  }

  clearFuzzy() {
    this.fuzzyService.fuzzyLoader.resetCache();
  }

  loadLanguage() {
    this.languageService.loadLanguage(this.settings.language);
  }
  changeTheme(newTheme: string) {
    this.listThemes();
    if (this.settings.theme !== newTheme) {
      this.settings.theme = newTheme;
      this.loadTheme();
      this.onSettingsChange();
    }
  }

  loadTheme() {
    // (the sidebar width set by dragging starts over with a new theme)
    document.documentElement.style.removeProperty("--nav-width");
    this.themeService.apply(this.settings.theme);
  }

  configDir() {
    this.settingsService.configDir();
  }
  steamDir() {
    this.settingsService.steamDir();
  }

  chooseAccounts() {
    if (this.settings.environmentVariables.steamDirectory) {
      this.chooseUserAccountsVisible = true;
    }
  }
  setUserAccounts(accounts: string[]) {
    if (accounts) {
      this.settings.environmentVariables.userAccounts = accounts;
    }
  }
  exitChooseAccounts() {
    this.chooseUserAccountsVisible = false;
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
}
