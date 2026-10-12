import { Injectable } from "@angular/core";
import { ConfigPresets } from "../../models";
import { LoggerService } from "./logger.service";
import { BehaviorSubject } from "rxjs";
import { PresetsStore } from "../../core/presets-store";
import { Fetch } from "../../core/http";

// Angular facade over the core PresetsStore.
@Injectable()
export class ConfigurationPresetsService {
  readonly store: PresetsStore;
  private variableData = new BehaviorSubject<ConfigPresets>({});
  private downloadStatus = new BehaviorSubject<boolean>(false);

  constructor(private loggerService: LoggerService) {
    this.store = new PresetsStore(
      this.loggerService,
      globalThis.fetch.bind(globalThis) as Fetch,
    );
    this.store.onChange((data) => this.variableData.next(data));
    this.store.onDownloadingChange((d) => this.downloadStatus.next(d));
    this.store.load();
  }

  get data() {
    return this.variableData.getValue();
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  get isDownloading() {
    return this.downloadStatus;
  }

  download(force: boolean = false) {
    return this.store.download(force);
  }
}
