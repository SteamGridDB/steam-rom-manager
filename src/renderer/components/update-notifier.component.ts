import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
} from "@angular/core";
import { AppSettings } from "../../models";
import { IpcService, SettingsService } from "../services";
import { APP } from "../../variables";

// electron-updater's download progress, as the main process sends it.
interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

@Component({
  selector: "update-notifier",
  template: `
    <div id="updateNotification">
      <div class="update-notifier-content">
        <p id="message" [innerHTML]="messageText"></p>
        @if (showProgress) {
          <div
            class="progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="percent"
          >
            <div class="progressFill" [style.width.%]="percent"></div>
          </div>
          <div class="progressDetail">
            <span>{{ progressDetail }}</span>
            <span>{{ percent }}%</span>
          </div>
        }
        <div
          id="no-button"
          class="noButton"
          (click)="showUpdater = false"
          [class.hidden]="initiatedDownload && !downloadComplete"
        >
          {{
            isPortableUpdate || downloadFailed
              ? lang.buttons.close
              : lang.buttons.no
          }}
        </div>
        <div
          id="yes-button"
          class="goButton"
          (click)="downloadUpdate()"
          [class.hidden]="initiatedDownload || isPortableUpdate || downloadFailed"
        >
          {{ lang.buttons.yes }}
        </div>
        <div
          id="cancel-button"
          class="noButton"
          (click)="cancelUpdate()"
          [class.hidden]="!initiatedDownload || downloadComplete"
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
  downloadFailed: boolean = false;
  messageText: string = "";
  progress: DownloadProgress | null = null;
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

  get showProgress() {
    return this.initiatedDownload && !this.downloadFailed;
  }

  get percent() {
    if (this.downloadComplete) return 100;
    return Math.floor(this.progress?.percent ?? 0);
  }

  // e.g. "12.3 MB of 85.0 MB · 4.2 MB/s"; nothing until the first progress.
  get progressDetail() {
    if (!this.progress || this.downloadComplete) return "";
    const { transferred, total, bytesPerSecond } = this.progress;
    return this.lang.messages.progress__i.interpolate({
      transferred: formatBytes(transferred),
      total: formatBytes(total),
      speed: formatBytes(bytesPerSecond),
    });
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
    this.downloadFailed = false;
    this.progress = null;
    this.messageText = this.lang.messages.downloading;
  }
  cancelUpdate() {
    this.ipcService.send("cancel_update");
    this.showUpdater = false;
    this.initiatedDownload = false;
    this.progress = null;
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
      } else if (typeof message == "string" && message == "update_error") {
        this.initiatedDownload = false;
        this.downloadFailed = true;
        this.progress = null;
        this.messageText = this.lang.messages.downloadFailed;
      } else if (message && typeof message["progress"] == "object") {
        this.progress = message["progress"];
      }
    }
    this.changeRef.markForCheck();
  }
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes || 0;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit < 2 ? 0 : 1)} ${units[unit]}`;
}
