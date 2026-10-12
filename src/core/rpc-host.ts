import { Logger, MessageSettings } from "../models";
import { Core } from "./core";
import {
  RpcEventMap,
  RpcRequest,
  RpcSyncReply,
  isAllowed,
  rpcChannels,
} from "./rpc";

// How the host talks to its UI; the main process implements this with
// ipcMain/webContents, tests with an in-memory pair.
export interface HostTransport {
  handleAsync(
    channel: string,
    handler: (req: RpcRequest) => Promise<any>,
  ): void;
  handleSync(channel: string, handler: (req: RpcRequest) => any): void;
  send(channel: string, payload: any): void;
}

type Emit = <K extends keyof RpcEventMap>(
  name: K,
  payload: RpcEventMap[K],
) => void;

const text = (message: any) =>
  message instanceof Error ? message.message : String(message);

// A Logger that forwards to the UI once one is attached (buffering until
// then, so messages logged during startup aren't lost).
export function createForwardingLogger() {
  let emit: Emit | undefined;
  const buffer: RpcEventMap["log"][] = [];
  const post =
    (level: RpcEventMap["log"]["level"]) =>
    (message: any, settings?: MessageSettings) => {
      const entry = { level, message: text(message), settings };
      if (emit) emit("log", entry);
      else buffer.push(entry);
    };
  const logger: Logger = {
    info: post("info"),
    success: post("success"),
    error: post("error"),
    fuzzy: post("fuzzy"),
  };
  return {
    logger,
    attach(e: Emit) {
      emit = e;
      for (const entry of buffer.splice(0)) emit("log", entry);
    },
  };
}

// Serves `core` to a UI: answers allowed calls and pushes state changes.
export function hostCore(
  core: Core,
  transport: HostTransport,
  forwardingLogger?: ReturnType<typeof createForwardingLogger>,
) {
  const loaded = new Set<string>();
  const emit: Emit = (name, payload) =>
    transport.send(rpcChannels.event, { name, payload });
  const targets: Record<string, any> = {
    settings: core.settings,
    parsers: core.parsers,
    exceptions: core.exceptions,
    customVariables: core.customVariables,
    presets: core.presets,
    fuzzy: core.fuzzy,
    builder: core.builder,
    writer: {
      save: (previewData: any, onlineImages: any, options: any) =>
        core.writer.save(previewData, onlineImages, options, (progress) =>
          emit("writer:progress", progress),
        ),
      exportSelection: (...args: any[]) =>
        (core.writer.exportSelection as any)(...args),
      readSelection: (path: string) => core.writer.readSelection(path),
    },
    providers: {
      // The UI picks the id; every event for this lookup carries it.
      retrieve: async (
        id: string,
        title: string,
        imageType: string,
        apis: any,
        provider: any,
      ) =>
        core.providers.retrieveUrls(
          title,
          imageType,
          apis,
          provider,
          (event, data) => emit("providers:event", { id, event, data }),
        ),
      stopUrlDownload: async () => core.providers.stopUrlDownload(),
    },
  };

  transport.handleAsync(rpcChannels.call, async ({ target, method, args }) => {
    if (!isAllowed(target, method, "async")) {
      throw new Error(`Not allowed: ${target}.${method}`);
    }
    return targets[target][method](...args);
  });

  transport.handleSync(
    rpcChannels.callSync,
    ({ target, method, args }): RpcSyncReply => {
      if (target === "core" && method === "loaded") {
        return { result: [...loaded] };
      }
      if (!isAllowed(target, method, "sync")) {
        return { error: `Not allowed: ${target}.${method}` };
      }
      try {
        const result = targets[target][method](...args);
        if (result instanceof Promise) {
          // e.g. a save kicked off by an edit: don't block the UI on it.
          result.catch((e) => forwardingLogger?.logger.error(e));
          return { result: undefined };
        }
        return { result };
      } catch (e) {
        return { error: text(e) };
      }
    },
  );

  forwardingLogger?.attach(emit);

  core.settings.onChange((settings) => emit("settings:changed", settings));
  core.parsers.onChange(() =>
    emit("parsers:changed", {
      configs: core.parsers.getAll(),
      deleted: core.parsers.getDeleted(),
    }),
  );
  core.exceptions.onChange((saved) => emit("exceptions:changed", saved));
  core.customVariables.onChange((data) =>
    emit("customVariables:changed", data),
  );
  core.customVariables.onDownloadingChange((d) =>
    emit("customVariables:downloading", d),
  );
  core.presets.onChange((data) => emit("presets:changed", data));
  core.presets.onDownloadingChange((d) => emit("presets:downloading", d));
  core.fuzzy.loader
    .observeList()
    .subscribe((list) => emit("fuzzy:list", { totalGames: list.totalGames }));
  core.providers.stopEvent.subscribe(() => emit("providers:stopped", null));

  for (const [name, promise] of Object.entries(core.ready ?? {})) {
    promise.then(() => {
      loaded.add(name);
      emit("ready", name);
    });
  }
}
