// The contract between the sandboxed UI and the main process: the preload
// script exposes `window.srm`, which can only use these IPC channels.
import { rpcChannels } from "./core/rpc";

// os.type() of the OSes SRM supports (BSDs etc. count as Linux).
export type OsType = "Windows_NT" | "Darwin" | "Linux";

export interface EnvInfo {
  osType: OsType;
  osName: string; // e.g. "Windows 11"
  arch: string;
  // Set when running the portable build (its folder).
  portableDir: string;
}

export const bridgeChannels = {
  invoke: [rpcChannels.call],
  sendSync: [rpcChannels.callSync],
  on: [rpcChannels.event, "updater_message"],
  send: ["download_update", "restart_app", "cancel_update"],
} as const;

// Answered synchronously by main when the preload starts.
export const envChannel = "srm:env";

export interface SrmBridge {
  env: EnvInfo;
  invoke(channel: string, ...args: any[]): Promise<any>;
  sendSync(channel: string, ...args: any[]): any;
  on(channel: string, listener: (payload: any) => void): void;
  send(channel: string, ...args: any[]): void;
}
