import { Injectable, NgZone } from "@angular/core";
import { bridge } from "../bridge";

// Messages to and from the main process outside the Core (app updates).
@Injectable()
export class IpcService {
  constructor(private zone: NgZone) {}

  public on(channel: string, listener: (payload: any) => void): void {
    bridge.on(channel, (payload) => this.zone.run(() => listener(payload)));
  }

  public send(channel: string, ...args: any): void {
    bridge.send(channel, ...args);
  }
}
