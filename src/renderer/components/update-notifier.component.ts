import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  ComponentFactoryResolver,
} from "@angular/core";
import { AppSettings } from "../../models";
import { IpcService, SettingsService } from "../services";
import { APP } from "../../variables";

@Component({
  selector: "update-notifier",
  template: `
    <div id="updateNotification">
      <div class="update-notifier-content">
        <p id="message" [innerHTML]="messageText"></p>
        <div
          id="no-button"
          class="noButton"
          (click)="showUpdater = false"
          [class.hidden]="initiatedDownload"
        >
          {{ isPortableUpdate ? lang.buttons.close : lang.buttons.no }}
        </div>
        <div
          id="yes-button"
          class="goButton"
          (click)="downloadUpdate()"
          [class.hidden]="initiatedDownload || isPortableUpdate"
        >
          {{ lang.buttons.yes }}
        </div>
        <div
          id="cancel-button"
          class="noButton"
          (click)="cancelUpdate()"
          [class.hidden]="!initiatedDownload"
        >
          {{ lang.buttons.cancel }}
        </div>
        <div
          id="restart-button"
          class="goButton"
          (click)="restartApp()"
          [class.hidden]="!downloadComplete"
        >
          {{ lang.buttons.restart }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ["../styles/update-notifier.component.scss"],
  host: {
    "[class.hidden]": "!showUpdater",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateNotifierComponent {
  showUpdater: boolean = false;
  isPortableUpdate: boolean = false;
  initiatedDownload: boolean = false;
  downloadComplete: boolean = false;
  messageText: string = "";
  private appSettings: AppSettings;
  constructor(
    private ipcService: IpcService,
    private settingsService: SettingsService,
    private changeRef: ChangeDetectorRef,
  ) {
    this.appSettings = this.settingsService.getSettings();
  }

  get lang() {
    return APP.lang.updateNotifier.component;
  }

  @Input()
  public set ipcMessage(message: any) {
    this.handleUpdateNotification(message);
  }
  restartApp() {
    this.ipcService.send("restart_app");
  }
  downloadUpdate() {
    this.ipcService.send("download_update");
    this.initiatedDownload = true;
  }
  cancelUpdate() {
    this.ipcService.send("cancel_update");
    this.showUpdater = false;
  }
  private handleUpdateNotification(message: any) {
    if (!this.appSettings.autoUpdate) {
      return;
    }
    if (
      this.appSettings.emudeckInstall &&
      typeof message == "string" &&
      message == "update_portable"
    ) {
      this.showUpdater = true;
      this.messageText = this.lang.messages.updateViaEmuDeck;
      this.isPortableUpdate = true;
    } else {
      if (typeof message == "string" && message == "update_available") {
        this.showUpdater = true;
        this.messageText = this.lang.messages.updateAvailable;
      } else if (typeof message == "string" && message == "update_portable") {
        this.showUpdater = true;
        this.isPortableUpdate = true;
        this.messageText = this.lang.messages.updatePortable;
      } else if (typeof message == "string" && message == "update_downloaded") {
        this.downloadComplete = true;
        this.messageText = this.lang.messages.updateDownloaded;
      } else {
        if (message["progress"]) {
          this.messageText = message["progress"];
          this.changeRef.detectChanges();
        }
      }
    }
  }
}
