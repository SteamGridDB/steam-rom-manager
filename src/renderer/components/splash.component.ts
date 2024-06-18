import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';
import { SettingsService } from '../services';
import { AppSettings } from '../../models';
import { APP } from '../../variables';
import * as os from 'os';

@Component({
  selector: 'splash',
  templateUrl: '../templates/splash.component.html',
  styleUrls: ['../styles/splash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashComponent {
    appSettings: AppSettings;
    @Input() stage: string;
    chooseUserAccountsVisible: boolean = false;
    @Output()
    setup = new EventEmitter<boolean>(false);

    constructor(
    private settingsService: SettingsService
    ) { 
        settingsService.onLoad((appSettings: AppSettings) => {
            this.appSettings = appSettings;
        })
    }

    get lang() {
        return APP.lang.settings.component;
    }
    get placeholderSteamDir() {
        return this.lang.placeholder.bySystem[os.type()].steamDirectory;
    }
    moveToUsers() {
        if(this.appSettings.environmentVariables.steamDirectory){
            this.stage = 'userAccounts'
        }
    }
    moveToSteamDir() {
        this.stage = 'steamDir';
    }

    setUserAccounts(accounts: string[]) {
        if(accounts) {
          this.appSettings.environmentVariables.userAccounts = accounts;
        }
    }

    chooseAccounts() {
        if(this.appSettings.environmentVariables.steamDirectory) {
          this.chooseUserAccountsVisible = true;
        }
      }

    finishSetup() {
        if(this.appSettings.environmentVariables.userAccounts) {
            this.setup.emit(true);
        }
    }

    onSettingsChange(detectChanges: boolean = true) {
        if (detectChanges) {
            this.settingsService.settingsChanged();
        }
        this.settingsService.saveAppSettings();
      }
}
