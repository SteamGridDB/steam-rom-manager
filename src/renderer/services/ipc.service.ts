import { Injectable } from "@angular/core";
import { IpcRenderer, IpcRendererEvent } from "electron";

@Injectable()
export class IpcService {
  private _ipc: IpcRenderer | undefined = void 0;

  constructor() {
    this._ipc = require("electron").ipcRenderer;
  }

  public on(
    channel: string,
    listener: (event: IpcRendererEvent, ...args: any[]) => void,
  ): void {
    if (this._ipc) {
      this._ipc.on(channel, listener);
    }
  }

  public send(channel: string, ...args: any): void {
    if (this._ipc) {
      this._ipc.send(channel, ...args);
    }
  }

  public removeListeners(channel: string) {
    this._ipc.removeAllListeners(channel);
  }
}
