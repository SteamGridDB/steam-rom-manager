import { Injectable } from "@angular/core";
import { ConfigPresets } from "../../models";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";

// Parser presets, owned by the PresetsStore in the main process.
@Injectable()
export class ConfigurationPresetsService {
  private variableData = new BehaviorSubject<ConfigPresets>({});
  private downloadStatus = new BehaviorSubject<boolean>(false);

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("presets:changed", (data) => this.variableData.next(data));
    client.on("presets:downloading", (d) => this.downloadStatus.next(d));
    client
      .whenLoaded("presets")
      .then(() => this.variableData.next(client.callSync("presets", "get")));
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

  download(force: boolean = false): Promise<void> {
    return this.coreClient.client.call("presets", "download", force);
  }
}
