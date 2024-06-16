import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import * as steam from '../../lib/helpers/steam';
import {userAccountData} from '../../models';
import * as fs from 'fs-extra';
import * as path from 'path';

@Component({
  selector: 'choose-accounts',
  templateUrl: '../templates/choose-accounts.component.html',
  styleUrls: ['../styles/choose-accounts.component.scss'],
  host: {
    '[class.hidden]':'!show'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ChooseAccountsComponent {
  steamDir: string = '';
  show: boolean = false;
  selectedAccounts: {[accountID: string]: string} = {};
  availableAccounts: userAccountData[] = [];
  @Output()
  showAccounts = new EventEmitter<boolean>();
  @Output()
  accountsJoined = new EventEmitter<string[]>();
  constructor(private changeRef: ChangeDetectorRef) {
  }
  @Input()
  public set steamDirectory(steamDirectory: string) {
    this.steamDir = steamDirectory;
    if(this.steamDir && fs.existsSync(this.steamDir)) {
      steam.getAvailableLogins(this.steamDir).then((userAccounts: userAccountData[]) => {
        this.availableAccounts = userAccounts;
        this.changeRef.detectChanges();
      })
    }
  }
  @Input()
  public set showChooseAccounts(showChooseAccounts: boolean) {
    this.show = showChooseAccounts;
  }

  cancelAccounts() {
    this.selectedAccounts = {};
    this.showAccounts.next(false);
  }

  saveAccounts() {
    //this.accountsJoined.next(Object.values(this.selectedAccounts).map(item=>`\$\{${item}\}`).join(''));
    this.accountsJoined.next(Object.values(this.selectedAccounts))
    this.cancelAccounts()
  }

  selectAccount(account: userAccountData) {
    if(this.selectedAccounts[account.accountID]) {
      delete this.selectedAccounts[account.accountID];
    } else {
      this.selectedAccounts[account.accountID] = account.name;
    }
  }

  getAccountImage(steamDirectory: string, steamID64: string) {
    const imagePath = path.join(steamDirectory,'config','avatarcache',`${steamID64}.png`);
    if(fs.existsSync(imagePath)) {
      return imagePath
    } else {
      return require("../../assets/images/unknown-account.png");
    }
  }
}
