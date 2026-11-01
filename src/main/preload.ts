import { contextBridge, ipcRenderer } from "electron";
import { SrmBridge, bridgeChannels, envChannel } from "../bridge";

// Runs in the (sandboxed) window before the UI and gives it `window.srm`:
// IPC limited to SRM's own channels, and facts about the OS.
function allowed(kind: keyof typeof bridgeChannels, channel: string) {
  if (!(bridgeChannels[kind] as readonly string[]).includes(channel)) {
    throw new Error(`IPC channel not allowed: ${channel}`);
  }
}

const srm: SrmBridge = {
  env: ipcRenderer.sendSync(envChannel),
  invoke(channel, ...args) {
    allowed("invoke", channel);
    return ipcRenderer.invoke(channel, ...args);
  },
  sendSync(channel, ...args) {
    allowed("sendSync", channel);
    return ipcRenderer.sendSync(channel, ...args);
  },
  on(channel, listener) {
    allowed("on", channel);
    // Not passing on the event: it gives access to ipcRenderer itself.
    ipcRenderer.on(channel, (_event, payload) => listener(payload));
  },
  send(channel, ...args) {
    allowed("send", channel);
    ipcRenderer.send(channel, ...args);
  },
};

contextBridge.exposeInMainWorld("srm", srm);
