import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, ParsersService, PreviewService, LanguageService, ImageProviderService, FuzzyService, CustomVariablesService, ConfigurationPresetsService } from "../services";
import { APP } from '../../variables';
import { AppSettings, SelectItem, userAccountData } from "../../models";
import { Subscription } from 'rxjs';
import * as os from 'os';
import * as steam from "../../lib/helpers/steam";

@Component({
  selector: 'settings',
  templateUrl: '../templates/settings.component.html',
  styleUrls: ['../styles/settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  private settings: AppSettings;
  private availableProviders: string[];
  private availableLanguages: SelectItem[];
  private knownSteamDirectories: string[];
  private retroarchPathPlaceholder: string;
  private steamDirectoryPlaceholder: string;
  private romsDirectoryPlaceholder: string;
  private localImagesDirectoryPlaceholder: string;
  private raCoresDirectoryPlaceholder: string;

  constructor(private settingsService: SettingsService,
    private fuzzyService: FuzzyService,
    private languageService: LanguageService,
    private imageProviderService: ImageProviderService,
    private previewService: PreviewService,
    private parsersService: ParsersService,
    private cpService: ConfigurationPresetsService,
    private cvService: CustomVariablesService,
    private changeDetectionRef: ChangeDetectorRef) {

    this.currentDoc.content = this.lang.docs__md.settings.join('');
    }

  ngOnInit() {
    this.subscriptions.add(this.settingsService.getChangeObservable().subscribe(() => {
      this.changeDetectionRef.detectChanges();
      this.knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    }));
    this.knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe(()=>{
      this.knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    }));
    this.settings = this.settingsService.getSettings();
    this.availableProviders = this.imageProviderService.instance.getAvailableProviders();
    this.availableLanguages = this.languageService.getAvailableLanguages().map((lang)=>{
      return {value: lang, displayValue: this.languageService.getReadableName(lang)}
    });
    if(os.type()=='Windows_NT'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathWin;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryWin;
      this.romsDirectoryPlaceholder = this.lang.placeholder.romsDirectoryWin;
      this.localImagesDirectoryPlaceholder = this.lang.placeholder.localImagesDirectoryWin;
      this.raCoresDirectoryPlaceholder = this.lang.placeholder.raCoresDirectoryWin;
    }
    else if(os.type()=='Darwin'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathMac;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryMac;
      this.romsDirectoryPlaceholder = this.lang.placeholder.romsDirectoryMac;
      this.localImagesDirectoryPlaceholder = this.lang.placeholder.localImagesDirectoryUnix;
      this.raCoresDirectoryPlaceholder = this.lang.placeholder.raCoresDirectoryMac;

    }
    else if(os.type()=='Linux'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathLinux;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryLinux;
      this.romsDirectoryPlaceholder = this.lang.placeholder.romsDirectoryLinux;
      this.localImagesDirectoryPlaceholder = this.lang.placeholder.localImagesDirectoryUnix;
      this.raCoresDirectoryPlaceholder = this.lang.placeholder.raCoresDirectoryLinux;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private get lang() {
    return APP.lang.settings.component;
  }

  private onSettingsChange(detectChanges: boolean = true) {
    if (detectChanges)
      this.settingsService.settingsChanged();

    this.settingsService.saveAppSettings();
  }

  private removeApps() {
    if (this.knownSteamDirectories.length > 0) {
      this.previewService.saveData(true);
    }
  }

  private removeControllersOnly() {
    for(let steamDir of this.knownSteamDirectories) {
      steam.getAvailableLogins(steamDir, false).then((accounts: userAccountData[])=>{
        for(let account of accounts) {
          this.parsersService.removeControllers(steamDir, account.accountID);
        }
      })
    }
  }

  private resetFuzzy(){
    this.fuzzyService.fuzzyLoader.resetList();
  }

  private clearFuzzy(){
    this.fuzzyService.fuzzyLoader.resetCache();
  }

  private preload(value: boolean) {
    if (this.settings.previewSettings.preload !== value && value)
      this.previewService.preloadImages();

    this.settings.previewSettings.preload = value;
  }

  private loadLanguage(){
    this.languageService.loadLanguage(this.settings.language);
  }

  configDir() {
    this.settingsService.configDir();
  }
}
