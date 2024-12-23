import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { APP } from "../../variables";
import { SettingsService } from "../services";
import { AppSettings } from "../../models";

@Component({
  selector: "parsers-list",
  templateUrl: "../templates/parsers-list.component.html",
  styleUrls: ["../styles/parsers-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParsersListComponent {
  appSettings: AppSettings;
  constructor(private settingsService: SettingsService) {
    this.appSettings = this.settingsService.getSettings();
  }
  get lang() {
    return APP.lang.parsersList.component;
  }
}
