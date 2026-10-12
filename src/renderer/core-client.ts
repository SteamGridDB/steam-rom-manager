import {
  RpcEvent,
  RpcEventMap,
  RpcRequest,
  RpcSyncReply,
  RpcTarget,
  rpcChannels,
} from "../core/rpc";

// How the UI reaches the Core in the main process (ipcRenderer in the app,
// an in-memory pair in tests).
export interface ClientTransport {
  invoke(channel: string, req: RpcRequest): Promise<any>;
  sendSync(channel: string, req: RpcRequest): any;
  on(channel: string, listener: (payload: any) => void): void;
}

type Listener<K extends keyof RpcEventMap> = (payload: RpcEventMap[K]) => void;

export class CoreClient {
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private loaded = new Set<string>();

  constructor(private transport: ClientTransport) {
    transport.on(rpcChannels.event, (event: RpcEvent) => {
      if (event.name === "ready") {
        this.loaded.add(event.payload as string);
      }
      for (const listener of this.listeners.get(event.name) ?? []) {
        listener(event.payload);
      }
    });
    for (const name of this.callSyncRaw("core", "loaded")) {
      this.loaded.add(name);
    }
  }

  call(target: RpcTarget, method: string, ...args: any[]): Promise<any> {
    return this.transport.invoke(rpcChannels.call, { target, method, args });
  }

  private callSyncRaw(target: string, method: string, ...args: any[]) {
    const reply: RpcSyncReply = this.transport.sendSync(rpcChannels.callSync, {
      target,
      method,
      args,
    });
    if ("error" in reply) {
      throw reply.error;
    }
    return reply.result;
  }

  // Throws (the error message string) like the store method would.
  callSync(target: RpcTarget, method: string, ...args: any[]): any {
    return this.callSyncRaw(target, method, ...args);
  }

  on<K extends keyof RpcEventMap>(name: K, listener: Listener<K>): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    this.listeners.get(name).add(listener);
    return () => this.listeners.get(name).delete(listener);
  }

  // Resolves once the named store has loaded in the main process.
  whenLoaded(store: string): Promise<void> {
    if (this.loaded.has(store)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const off = this.on("ready", (name) => {
        if (name === store) {
          off();
          resolve();
        }
      });
    });
  }
}
// Updates `target` to equal `source` without replacing it (or its nested
// objects), so references held by components stay valid.
export function syncInPlace(target: any, source: any) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete target[key];
    }
  }
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      syncInPlace(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
