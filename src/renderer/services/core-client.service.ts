import { Injectable, NgZone } from "@angular/core";
import { CoreClient, ClientTransport } from "../core-client";
import { LoggerService } from "./logger.service";
import { bridge } from "../bridge";

// IPC to the Core hosted in the main process. Listeners run in Angular's
// zone (calls from the preload's context don't), so the UI updates.
function ipcTransport(zone: NgZone): ClientTransport {
  return {
    invoke: (channel, req) => bridge.invoke(channel, req),
    sendSync: (channel, req) => bridge.sendSync(channel, req),
    on: (channel, listener) =>
      bridge.on(channel, (payload) => zone.run(() => listener(payload))),
  };
}

// The UI's connection to the Core in the main process. Also shows the
// core's log messages in the UI's log/alerts.
@Injectable()
export class CoreClientService {
  readonly client: CoreClient;

  constructor(
    private loggerService: LoggerService,
    zone: NgZone,
  ) {
    this.client = new CoreClient(ipcTransport(zone));
    this.client.on("log", ({ level, message, settings }) => {
      this.loggerService[level](message, settings);
    });
  }

  // For failed calls: errors from main arrive as "Error invoking remote
  // method ...: Error: <message>".
  logError(e: any) {
    const message = String(e?.message ?? e).replace(
      /^Error invoking remote method '[^']*': (Error: )?/,
      "",
    );
    this.loggerService.error(message);
  }
}
