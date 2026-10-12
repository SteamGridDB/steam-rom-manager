import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { userAccountData } from "../../models";
import type { SteamLogin } from "../../core/ui-support";
import { CoreClientService } from "../services/core-client.service";
import { APP } from "../../variables";

@Component({
  selector: "choose-accounts",
  templateUrl: "../templates/choose-accounts.component.html",
  styleUrls: ["../styles/choose-accounts.component.scss"],
  host: {
    "[class.hidden]": "!show",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseAccountsComponent {
  steamDir: string = "";
  show: boolean = false;
  selectedAccounts: { [accountID: string]: string } = {};
  availableAccounts: SteamLogin[] = [];
  @Output()
  showAccounts = new EventEmitter<boolean>();
  @Output()
  accountsJoined = new EventEmitter<string[]>();
  constructor(
    private changeRef: ChangeDetectorRef,
    private coreClient: CoreClientService,
  ) {}

  get lang() {
    return APP.lang.chooseAccounts.component;
  }

  @Input()
  public set steamDirectory(steamDirectory: string) {
    this.steamDir = steamDirectory;
    if (this.steamDir) {
      this.coreClient.client
        .call("support", "steamLogins", this.steamDir)
        .then((userAccounts: SteamLogin[]) => {
          this.availableAccounts = userAccounts;
          this.changeRef.detectChanges();
        });
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
    this.accountsJoined.next(Object.values(this.selectedAccounts));
    this.cancelAccounts();
  }

  selectAccount(account: userAccountData) {
    if (this.selectedAccounts[account.accountID]) {
      delete this.selectedAccounts[account.accountID];
    } else {
      this.selectedAccounts[account.accountID] = account.name;
    }
  }

  getAccountImage(account: SteamLogin) {
    return account.avatar || require("../../assets/images/unknown-account.png");
  }
}
