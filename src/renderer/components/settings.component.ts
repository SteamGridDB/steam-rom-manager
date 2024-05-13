import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService, ParsersService, PreviewService, LanguageService, ImageProviderService, FuzzyService, CustomVariablesService, ConfigurationPresetsService, ShellScriptsService, IpcService, LoggerService } from "../services";
import { APP } from '../../variables';
import { AppSettings, OnlineProviderType,ImageProviderName, SelectItem, userAccountData } from "../../models";
import { Subscription, BehaviorSubject } from 'rxjs';
import { availableThemes } from "../../lib/themes";
import * as os from 'os';
import * as steam from "../../lib/helpers/steam";
import { ArtworkCache } from '../../lib';
import { fstat } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import * as paths from '../../paths';
import { providersSelect } from '../../lib/image-providers/available-providers';

@Component({
  selector: 'settings',
  templateUrl: '../templates/settings.component.html',
  styleUrls: ['../styles/settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {
  currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  settings: AppSettings;
  availableBatches: {displayValue: string, value: number}[];
  themes: string[];
  availableLanguages: SelectItem[];
  knownSteamDirectories: string[];
  retroarchPathPlaceholder: string;
  steamDirectoryPlaceholder: string;
  userAccountsPlaceholder: string;
  romsDirectoryPlaceholder: string;
  localImagesDirectoryPlaceholder: string;
  raCoresDirectoryPlaceholder: string;
  chooseUserAccountsVisible: boolean = false;
  showShellScripts: boolean = false;
  private subscriptions: Subscription = new Subscription();
  private CLI_MESSAGE: BehaviorSubject<string> = new BehaviorSubject("");
  constructor(private settingsService: SettingsService,
    private fuzzyService: FuzzyService,
    private languageService: LanguageService,
    private loggerService: LoggerService,
    private imageProviderService: ImageProviderService,
    private previewService: PreviewService,
    private parsersService: ParsersService,
    public cpService: ConfigurationPresetsService,
    public cvService: CustomVariablesService,
    public ssService: ShellScriptsService,
    private changeDetectionRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private ipcService: IpcService
             ) {

    this.currentDoc.content = this.lang.docs__md.settings.join('');
    this.activatedRoute.queryParamMap.subscribe((paramContainer: any)=> {
      let params = ({...paramContainer} as any).params;
      if(params['cliMessage']) {
        this.CLI_MESSAGE.next(params['cliMessage']);
      }
    });
  }

  get availableProviders() {
    return providersSelect
  }

  get lang() {
    return APP.lang.settings.component;
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
    this.availableBatches = [10, 20, 50, 100, 200, 500].map(x=>{
      return {value: x, displayValue: x.toString()}
    })
    this.availableLanguages = this.languageService.getAvailableLanguages().map((lang)=>{
      return {value: lang, displayValue: this.languageService.getReadableName(lang)}
    });
    this.themes = availableThemes;
    this.userAccountsPlaceholder = this.lang.placeholder.userAccounts;
    if(os.type()=='Windows_NT'){
      this.showShellScripts = true;
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

  ngAfterViewInit() {
    this.subscriptions.add(this.CLI_MESSAGE.asObservable().subscribe((cliMessage: string)=> {
      const parsedCLI = cliMessage ? JSON.parse(cliMessage)||{} : {};
      if(['nuke'].includes(parsedCLI.command)) {
        this.ipcService.send('log','Nuking steam library');
        this.removeApps().then(()=> {
          this.ipcService.send('all_done')
        })
      }
    }))
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onSettingsChange(detectChanges: boolean = true) {
    if (detectChanges)
      this.settingsService.settingsChanged();

    this.settingsService.saveAppSettings();
  }

  async nukeArtworkChoices() {
    const artworkCache = new ArtworkCache();
    await artworkCache.read();
    await artworkCache.emptyCache();
    this.loggerService.info('Emptied artwork cache.', {invokeAlert: true, alertTimeout: 3000})
  }

  nukeArtworkBackups() {
    const backupsDir = path.join(paths.userDataDir,'artworkBackups');
    if(fs.existsSync(backupsDir)) {
      fs.rmSync(backupsDir, { recursive: true, force: true });
    }
    this.loggerService.info('Nuked artwork backups.', {invokeAlert: true, alertTimeout: 3000})
  }

  removeApps() {
    if (this.knownSteamDirectories.length > 0) {
      return this.previewService.saveData({removeAll: true, batchWrite: false})
      .then(() => {
        this.removeCategoriesOnly();
      })
      .then(() => {
        this.removeControllersOnly();
      });
    }
  }

  async removeCategoriesOnly() {
    for(let steamDir of this.knownSteamDirectories) {
      const accounts = await steam.getAvailableLogins(steamDir);
      for(let account of accounts) {
        await this.previewService.removeCategories(steamDir, account.accountID)
      }
    }
  }

  async removeControllersOnly() {
    for(let steamDir of this.knownSteamDirectories) {
      const accounts = await steam.getAvailableLogins(steamDir);
      for(let account of accounts) {
        await this.parsersService.removeControllers(steamDir, account.accountID);
      }
    }
  }

  resetFuzzy(){
    this.fuzzyService.fuzzyLoader.resetList();
  }

  clearFuzzy(){
    this.fuzzyService.fuzzyLoader.resetCache();
  }

  preload(value: boolean) {
    if (this.settings.previewSettings.preload !== value && value)
      this.previewService.preloadImages();

    this.settings.previewSettings.preload = value;
  }

  loadLanguage(){
    this.languageService.loadLanguage(this.settings.language);
  }

  loadTheme(){
    document.querySelector('html').className = '';
    document.querySelector('html').classList.add(this.settings.theme)
    document.querySelector('html').removeAttribute("style");
  }

  configDir() {
    this.settingsService.configDir();
  }

  chooseAccounts() {
    if(this.settings.environmentVariables.steamDirectory) {
      this.chooseUserAccountsVisible = true;
    }
  }
  setUserAccounts(accounts: string) {
    if(accounts) {
      this.settings.environmentVariables.userAccounts = accounts;
    }
  }
  exitChooseAccounts() {
    this.chooseUserAccountsVisible = false;
  }
}
