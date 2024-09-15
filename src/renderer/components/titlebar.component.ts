import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import * as remote from "@electron/remote";
import { FuzzyService } from "../services";

@Component({
  selector: "titlebar",
  template: `
    <div class="icon"></div>
    <div class="title">
      <span>{{ getTitle() }}</span>
    </div>
    <div class="buttons">
      <div *ngIf="minimizable" class="minimize" (click)="minimizeEvent()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 300 300"
        >
          <polyline points="90,210 210,210" style="stroke-width:15;" />
        </svg>
      </div>
      <div *ngIf="maximizable" class="maximize" (click)="maximizeEvent()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 300 300"
        >
          <polyline
            points="150,90 210,90 210,210 90,210 90,90 150,90"
            style="stroke-width:15;fill:none;"
          />
        </svg>
      </div>
      <div class="close" (click)="closeEvent()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 300 300"
        >
          <polyline points="80 80 220 220" style="stroke-width:15;" />
          <polyline points="80 220 220 80" style="stroke-width:15;" />
        </svg>
      </div>
    </div>
  `,
  styleUrls: ["../styles/titlebar.component.scss"],
})
export class TitleComponent {
  minimizable: boolean;
  maximizable: boolean;
  private mainWindow: Electron.BrowserWindow;

  constructor(
    private title: Title,
    private fuzzyService: FuzzyService,
  ) {
    this.mainWindow = remote.getCurrentWindow();
    this.minimizable = this.mainWindow.minimizable;
    this.maximizable = this.mainWindow.maximizable;
    this.mainWindow.once("close", this.onClose.bind(this));
  }

  minimizeEvent() {
    if (this.minimizable) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      else this.mainWindow.minimize();
    }
  }

  maximizeEvent() {
    if (this.maximizable) {
      if (this.mainWindow.isMaximized()) this.mainWindow.unmaximize();
      else this.mainWindow.maximize();
    }
  }

  closeEvent() {
    this.onClose(null);
  }

  getTitle() {
    return this.title.getTitle();
  }

  private onClose(event: Electron.Event) {
    if (event) event.preventDefault();

    this.fuzzyService.saveCacheIfNeeded().then(() => {
      this.mainWindow.close();
    });
  }
}
