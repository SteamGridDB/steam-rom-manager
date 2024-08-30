import { Component } from "@angular/core";
import { AppSettings } from "../../models";
import { APP } from "../../variables";
import { SettingsService } from "../services";
@Component({
  selector: "about",
  template: `
    <markdown
      [content]="lang.info__md.join('').replace('emudeckText', emudeckText)"
    ></markdown>
  `,
  styleUrls: ["../styles/about.component.scss"],
})
export class AboutComponent {
  emudeckText: string = "";
  private appSettings: AppSettings;
  constructor(private settingsService: SettingsService) {
    this.appSettings = this.settingsService.getSettings();
    if (this.appSettings.emudeckInstall) {
      this.emudeckText = "**(EmuDeck)**";
    }
  }
  get lang() {
    return APP.lang.about.component;
  }
}
