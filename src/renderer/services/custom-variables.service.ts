import { Injectable } from "@angular/core";
import { CustomVariables } from "../../models";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";

// Custom variables, owned by the CustomVariablesStore in the main process.
@Injectable()
export class CustomVariablesService {
  private variableData = new BehaviorSubject<CustomVariables>({});
  private downloadStatus = new BehaviorSubject<boolean>(false);

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("customVariables:changed", (data) =>
      this.variableData.next(data),
    );
    client.on("customVariables:downloading", (d) =>
      this.downloadStatus.next(d),
    );
    client
      .whenLoaded("customVariables")
      .then(() =>
        this.variableData.next(client.callSync("customVariables", "get")),
      );
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
    return this.coreClient.client.call("customVariables", "download", force);
  }
}
