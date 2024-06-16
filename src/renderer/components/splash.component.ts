import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';
import { SettingsService } from '../services';
import { AppSettings } from '../../models';

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
    moveToUsers() {
        if(this.appSettings.environmentVariables.steamDirectory){
            this.stage = 'userAccounts'
        }
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
