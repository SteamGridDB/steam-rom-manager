import { Injectable } from "@angular/core";
import { CoreClient, ClientTransport } from "../core-client";
import { LoggerService } from "./logger.service";

// Electron IPC to the Core hosted in the main process.
function ipcTransport(): ClientTransport {
  const { ipcRenderer } = require("electron");
  return {
    invoke: (channel, req) => ipcRenderer.invoke(channel, req),
    sendSync: (channel, req) => ipcRenderer.sendSync(channel, req),
    on: (channel, listener) =>
      ipcRenderer.on(channel, (_event: unknown, payload: any) =>
        listener(payload),
      ),
  };
}

// The UI's connection to the Core in the main process. Also shows the
// core's log messages in the UI's log/alerts.
@Injectable()
export class CoreClientService {
  readonly client: CoreClient;

  constructor(private loggerService: LoggerService) {
    this.client = new CoreClient(ipcTransport());
    this.client.on("log", ({ level, message, settings }) => {
      this.loggerService[level](message, settings);
    });
  }
}
