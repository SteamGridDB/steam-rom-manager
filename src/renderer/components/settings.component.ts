import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, PreviewService, LanguageService, ImageProviderService, FuzzyService, CustomVariablesService, ConfigurationPresetsService } from "../services";
import { APP } from '../../variables';
import { AppSettings } from "../../models";
import { Subscription } from 'rxjs';
import * as os from 'os';

@Component({
  selector: 'settings',
  templateUrl: '../templates/settings.component.html',
  styleUrls: ['../styles/settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private settings: AppSettings;
  private availableProviders: string[];
  private availableLanguages: string[];
  private retroarchPathPlaceholder: string;
  private steamDirectoryPlaceholder: string;
  private localImagesDirectoryPlaceholder: string;
  private raCoresDirectoryPlaceholder: string;

  constructor(private settingsService: SettingsService,
    private fuzzyService: FuzzyService,
    private languageService: LanguageService,
    private imageProviderService: ImageProviderService,
    private previewService: PreviewService,
    private cpService: ConfigurationPresetsService,
    private cvService: CustomVariablesService,
    private changeDetectionRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.subscriptions.add(this.settingsService.getChangeObservable().subscribe(() => {
      this.changeDetectionRef.detectChanges();
    }));
    this.settings = this.settingsService.getSettings();
    this.availableProviders = this.imageProviderService.instance.getAvailableProviders();
    this.availableLanguages = this.languageService.getAvailableLanguages();
    if(os.type()=='Windows_NT'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathWin;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryWin;
      this.localImagesDirectoryPlaceholder = this.lang.placeholder.localImagesDirectoryWin;
      this.raCoresDirectoryPlaceholder = this.lang.placeholder.raCoresDirectoryWin;
    }
    else if(os.type()=='Darwin'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathMac;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryMac;
      this.localImagesDirectoryPlaceholder = this.lang.placeholder.localImagesDirectoryUnix;
      this.raCoresDirectoryPlaceholder = this.lang.placeholder.raCoresDirectoryMac;

    }
    else if(os.type()=='Linux'){
      this.retroarchPathPlaceholder = this.lang.placeholder.retroarchPathLinux;
      this.steamDirectoryPlaceholder = this.lang.placeholder.steamDirectoryLinux;
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
    if (this.settings.knownSteamDirectories.length > 0)
      this.previewService.saveData(true);
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
}
