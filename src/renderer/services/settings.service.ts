import { Injectable } from "@angular/core";
import { AppSettings } from "../../models";
import { LoggerService } from "./logger.service";
import { Subject, BehaviorSubject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import * as file from "../../lib/helpers/file";
import * as paths from "../../paths";
import { SettingsStore } from "../../core/settings-store";

// Angular facade over the core SettingsStore.
@Injectable()
export class SettingsService {
  private changeSubject: Subject<AppSettings> = new Subject();
  private settingsLoadedSubject: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );
  readonly store: SettingsStore;

  constructor(private loggerService: LoggerService) {
    this.store = new SettingsStore(this.loggerService);
    this.store.onChange((settings) => this.changeSubject.next(settings));
    this.store.load().then(() => this.settingsLoadedSubject.next(true));
  }

  getSettings() {
    return this.store.get();
  }

  settingsChanged() {
    this.store.changed();
  }

  getChangeObservable() {
    return this.changeSubject.asObservable();
  }

  saveAppSettings() {
    this.store.save();
  }

  configDir() {
    file.dirOpen(paths.userDataDir);
  }
  steamDir() {
    file.dirOpen(this.getSettings().environmentVariables.steamDirectory);
  }

  onLoad(callback: (appSettings: AppSettings) => void) {
    this.settingsLoadedSubject
      .asObservable()
      .pipe(
        takeWhile((loaded: boolean) => {
          if (loaded) callback(this.getSettings());
          return !loaded;
        }),
      )
      .subscribe();
  }
}
