import { Injectable } from "@angular/core";
import { AppSettings } from "../../models";
import { Subject, BehaviorSubject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import * as _ from "lodash";
import * as file from "../../lib/helpers/file";
import * as paths from "../../paths";
import { CoreClientService } from "./core-client.service";
import { syncInPlace } from "../core-client";

// The app settings, owned by the Core in the main process. Components get
// one settings object (a mirror) for the app's lifetime, edit it in place
// and call saveAppSettings()/settingsChanged() to hand the edits over.
@Injectable()
export class SettingsService {
  private changeSubject: Subject<AppSettings> = new Subject();
  private settingsLoadedSubject = new BehaviorSubject<boolean>(false);
  private settings: AppSettings;

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    // Defaults until the user's settings have loaded.
    this.settings = client.callSync("settings", "get");
    client.on("settings:changed", (settings) => this.applyFromMain(settings));
    client.whenLoaded("settings").then(() => {
      syncInPlace(this.settings, client.callSync("settings", "get"));
      this.settingsLoadedSubject.next(true);
    });
  }

  // Settings changed in the main process (e.g. parser groups, fuzzy list
  // timestamps).
  private applyFromMain(settings: AppSettings) {
    if (!_.isEqual(settings, this.settings)) {
      syncInPlace(this.settings, settings);
      this.changeSubject.next(this.settings);
    }
  }

  // Re-reads the settings from the main process, e.g. after an action there
  // changed them.
  refresh() {
    this.applyFromMain(this.coreClient.client.callSync("settings", "get"));
  }

  // Sends in-place edits to the main process without saving them.
  push() {
    this.coreClient.client.callSync("settings", "replace", this.settings, {
      save: false,
    });
  }

  getSettings() {
    return this.settings;
  }

  settingsChanged() {
    this.push();
    this.changeSubject.next(this.settings);
  }

  getChangeObservable() {
    return this.changeSubject.asObservable();
  }

  saveAppSettings() {
    this.coreClient.client.callSync("settings", "replace", this.settings, {
      save: true,
    });
  }

  configDir() {
    file.dirOpen(paths.userDataDir);
  }
  steamDir() {
    file.dirOpen(this.settings.environmentVariables.steamDirectory);
  }

  onLoad(callback: (appSettings: AppSettings) => void) {
    this.settingsLoadedSubject
      .asObservable()
      .pipe(
        takeWhile((loaded: boolean) => {
          if (loaded) callback(this.settings);
          return !loaded;
        }),
      )
      .subscribe();
  }
}
