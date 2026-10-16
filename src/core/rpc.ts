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
      "exceptionFor",
      "setGameException",
      "deleteGameException",
      "exclude",
      "removeExclusions",
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
    async: ["retrieve", "stopUrlDownload", "possibleIds"],
  },
  // "View Games": what is in Steam now.
  library: {
    sync: [],
    async: ["read", "details", "launch"],
  },
  shellScripts: {
    sync: ["getDownloading"],
    async: ["download"],
  },
  support: {
    sync: ["browsedValue"],
    async: [
      "steamLogins",
      "compatTools",
      "clearArtworkCache",
      "clearArtworkBackups",
      "userThemes",
      "submitBugReport",
    ],
  },
  // Window and OS integration; only the Electron main process provides it.
  app: {
    sync: ["windowInfo"],
    async: ["openDialog", "openFolder", "minimize", "toggleMaximize", "close"],
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
// `seq`: the number of the last event sent before this reply (see RpcEvent).
export type RpcSyncReply = ({ result: any } | { error: string }) & {
  seq: number;
};

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
  "shellScripts:downloading": boolean;
  ready: string; // a store name, once it has loaded
}

// Events are numbered. A sync reply carries the latest number, so the UI can
// tell an event that arrives after it has already read newer state (sync
// calls return immediately, events are delivered asynchronously).
export interface RpcEvent<K extends keyof RpcEventMap = keyof RpcEventMap> {
  name: K;
  payload: RpcEventMap[K];
  seq: number;
}
