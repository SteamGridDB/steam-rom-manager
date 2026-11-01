import { ipcMain, BrowserWindow } from "electron";
import { Core } from "../core/core";
import {
  HostTransport,
  createForwardingLogger,
  hostCore,
} from "../core/rpc-host";
import { rpcChannels } from "../core/rpc";
import { appTarget } from "./app-target";

// Creates the GUI's Core in this (main) process and serves it to the
// window over IPC. Events are queued until the window's UI connects.
export function startCoreForWindow(getWindow: () => BrowserWindow | null) {
  const forwarding = createForwardingLogger();
  const core = new Core({ logger: forwarding.logger });
  core.start();
  core.fuzzy.startAutoSave();

  let connected = false;
  const queue: [string, any][] = [];
  const transport: HostTransport = {
    handleAsync: (channel, handler) =>
      ipcMain.handle(channel, (_event, req) => handler(req)),
    handleSync: (channel, handler) =>
      ipcMain.on(channel, (event, req) => {
        if (!connected) {
          connected = true;
          setImmediate(() => {
            for (const [ch, payload] of queue.splice(0)) send(ch, payload);
          });
        }
        event.returnValue = handler(req);
      }),
    send: (channel, payload) => {
      if (connected) send(channel, payload);
      else queue.push([channel, payload]);
    },
  };
  const send = (channel: string, payload: any) => {
    const window = getWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  };
  hostCore(core, transport, forwarding, { app: appTarget(getWindow) });
  return core;
}

export { rpcChannels };
