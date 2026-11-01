import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";

// Helper scripts for some parsers, downloaded by the main process (on
// Windows at startup; again from Settings on request).
@Injectable()
export class ShellScriptsService {
  private downloadStatus = new BehaviorSubject<boolean>(false);

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("shellScripts:downloading", (d) => this.downloadStatus.next(d));
    this.downloadStatus.next(client.callSync("shellScripts", "getDownloading"));
    client.markFresh("shellScripts:downloading");
  }

  get isDownloading() {
    return this.downloadStatus;
  }

  download(force: boolean = false): Promise<void> {
    return this.coreClient.client.call("shellScripts", "download");
  }
}
