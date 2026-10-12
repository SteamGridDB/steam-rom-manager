// The contract between the renderer (UI) and the Core hosted in the main
// process. Only methods listed here can be called from the renderer.
//
// "sync" methods are cheap and answered with ipcRenderer.sendSync: form
// validation, path parsing, and edits whose result the UI reads right away.
// "async" methods do real work (I/O, network) and are awaited.

export const rpcChannels = {
  call: "core:call", // async: ipcRenderer.invoke
  callSync: "core:call-sync", // sync: ipcRenderer.sendSync
  event: "core:event", // main -> renderer notifications
} as const;

export const rpcApi = {
  settings: {
    sync: ["get", "replace"],
    async: [],
  },
  parsers: {
    sync: [
      "getAll",
      "getDeleted",
      "getDefaultValues",
      "getParserInfoForUi",
      "parseSteamDir",
      "getKnownSteamDirectories",
      "validate",
      "isConfigurationValid",
      "resolveParserIds",
      "getControllerTemplatesCache",
      "setControllerTemplatesCache",
      "add",
      "update",
      "swapIndex",
      "injectIndex",
      "moveParser",
      "delete",
      "restore",
      "addGroup",
      "renameGroup",
      "removeGroup",
      "reorderGroups",
      "setGroupCollapsed",
    ],
    async: [
      "setGroupEnabled",
      "setEnabled",
      "setAllEnabled",
      "executeFileParser",
      "parseUserAccounts",
      "getControllerTemplates",
      "saveControllerTemplates",
      "removeControllers",
      "removeAllControllers",
    ],
  },
  exceptions: {
    sync: [
      "get",
      "validate",
      "setSaved",
      "save",
      "makeExceptionId",
      "addById",
      "deleteById",
      "putBack",
    ],
    async: [],
  },
  customVariables: {
    sync: ["get"],
    async: ["download"],
  },
  presets: {
    sync: ["get"],
    async: ["download"],
  },
  fuzzy: {
    sync: ["getListInfo"],
    async: ["resetList", "resetCache", "saveCacheIfNeeded"],
  },
  // The preview list itself lives in the UI (PreviewEngine); building it and
  // writing it to Steam need the file system.
  builder: {
    sync: [],
    async: ["build"],
  },
  writer: {
    // save's progress arrives as "writer:progress" events.
    sync: [],
    async: ["save", "exportSelection", "readSelection"],
  },
  // Online artwork lookups; results arrive as "providers:event" events.
  providers: {
    sync: [],
    async: ["retrieve", "stopUrlDownload"],
  },
} as const;

export type RpcTarget = keyof typeof rpcApi;

export function isAllowed(
  target: string,
  method: string,
  kind: "sync" | "async",
): target is RpcTarget {
  const api = (rpcApi as any)[target];
  return !!api && (api[kind] as readonly string[]).includes(method);
}

export interface RpcRequest {
  target: string;
  method: string;
  args: any[];
}

// Sync calls can't reject; errors come back in the reply.
export type RpcSyncReply = { result: any } | { error: string };

// Events main pushes to the renderer.
export interface RpcEventMap {
  log: {
    level: "info" | "success" | "error" | "fuzzy";
    message: string;
    settings?: any;
  };
  "settings:changed": any;
  "parsers:changed": { configs: any[]; deleted: any[] };
  "parsers:controllerTemplates": any;
  "exceptions:changed": any;
  "customVariables:changed": any;
  "customVariables:downloading": boolean;
  "presets:changed": any;
  "presets:downloading": boolean;
  "fuzzy:list": { totalGames: number };
  "writer:progress": { update: string; batch: number };
  "providers:event": { id: string; event: string; data: any };
  "providers:stopped": null;
  ready: string; // a store name, once it has loaded
}

export interface RpcEvent<K extends keyof RpcEventMap = keyof RpcEventMap> {
  name: K;
  payload: RpcEventMap[K];
}
