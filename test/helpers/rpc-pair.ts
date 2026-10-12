// An in-memory stand-in for Electron IPC between a Core host and the UI.
// Every message is structured-cloned, as with real IPC, so anything that
// can't cross the process boundary (functions, class instances) fails here.
import { HostTransport } from "../../src/core/rpc-host";
import { ClientTransport } from "../../src/renderer/core-client";

export function makeRpcPair() {
  const asyncHandlers = new Map<string, (req: any) => Promise<any>>();
  const syncHandlers = new Map<string, (req: any) => any>();
  const listeners = new Map<string, Set<(payload: any) => void>>();

  const host: HostTransport = {
    handleAsync: (channel, handler) => asyncHandlers.set(channel, handler),
    handleSync: (channel, handler) => syncHandlers.set(channel, handler),
    send: (channel, payload) => {
      const copy = structuredClone(payload);
      setImmediate(() => {
        for (const listener of listeners.get(channel) ?? []) listener(copy);
      });
    },
  };
  const client: ClientTransport = {
    invoke: async (channel, req) =>
      structuredClone(await asyncHandlers.get(channel)(structuredClone(req))),
    sendSync: (channel, req) =>
      structuredClone(syncHandlers.get(channel)(structuredClone(req))),
    on: (channel, listener) => {
      if (!listeners.has(channel)) listeners.set(channel, new Set());
      listeners.get(channel).add(listener);
    },
  };
  return { host, client };
}
