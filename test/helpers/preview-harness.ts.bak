// Drives the real PreviewService (generate preview -> save/remove/nuke) in
// plain Node, with offline fakes for its Angular collaborators. This is the
// code the core-services refactor moves, so it is pinned end to end: from
// parser configs to the files that land in a (fake) Steam install.
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { AddressInfo } from "net";
import { Subject } from "rxjs";
import { PreviewEngine } from "../../src/core/preview-engine";
import { FileParser } from "../../src/lib/file-parser";
import { FuzzyMatcher } from "../../src/lib/fuzzy-matcher";
import { AppSettings, UserConfiguration } from "../../src/models";

const shortcutsParser = require("steam-shortcut-editor");
import * as genericParser from "@node-steam/vdf";

// A 1x1 PNG, served for every artwork URL.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
  "base64",
);

export async function startImageServer() {
  const requests: string[] = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url!);
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(PNG);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export interface LogEntry {
  level: "info" | "success" | "error";
  message: string;
  stack?: string;
}

// SteamGridDB-like results per search query: one image per artwork type.
export type FakeArtwork = { [query: string]: { gameId: string } };

export function makePreviewService(opts: {
  configs: UserConfiguration[];
  settings: AppSettings;
  knownSteamDirectories: string[];
  imageBase: string;
  artwork?: FakeArtwork;
  fuzzyList?: string[];
}) {
  const log: LogEntry[] = [];
  const record =
    (level: LogEntry["level"]) => (message: any, _options?: unknown) => {
      log.push({
        level,
        message: message instanceof Error ? message.message : String(message),
        stack: message instanceof Error ? message.stack : undefined,
      });
    };
  const loggerService = {
    info: record("info"),
    success: record("success"),
    error: record("error"),
  };

  const fuzzyList = opts.fuzzyList ?? [];
  const fileParser = new FileParser({
    fuzzyMatcher: new FuzzyMatcher(undefined, {
      totalGames: fuzzyList.length,
      games: fuzzyList,
    }),
  } as any);

  // The parts of ParsersStore the engine uses.
  const parsers = {
    getAll: () => opts.configs,
    getKnownSteamDirectories: () => opts.knownSteamDirectories,
    executeFileParser: async () => ({
      parsedData: await fileParser.executeFileParser(
        opts.configs.filter((c) => !c.disabled),
        opts.settings,
      ),
      skipped: [] as string[],
      invalid: [] as string[],
    }),
  };

  const settings = { get: () => opts.settings };

  // Emits provider events asynchronously, like the real providers.
  const providers = {
    stopEvent: new Subject<void>(),
    stopUrlDownload: () => {},
    retrieveUrls: (
      title: string,
      artworkType: string,
      _apis: unknown,
      provider: string,
      callback: (event: string, data: any) => void,
    ) => {
      setImmediate(() => {
        const match = opts.artwork?.[title];
        if (provider === "sgdb" && match) {
          callback("image", {
            provider,
            content: {
              imageProvider: "SteamGridDB",
              imageUrl: `${opts.imageBase}/${artworkType}/${match.gameId}.png`,
              imageGameId: match.gameId,
              imageArtworkId: `${match.gameId}-${artworkType}`,
              loadStatus: "notStarted",
            },
          });
        }
        callback("completed", { provider });
      });
    },
  };

  const service = new PreviewEngine(
    loggerService as any,
    parsers as any,
    providers as any,
    settings as any,
  );

  // Same completion condition the CLI uses (preview.component.ts).
  async function generate() {
    service.generatePreviewData();
    const vars = service.getPreviewVariables();
    const deadline = Date.now() + 20000;
    while (
      vars.listIsBeingGenerated ||
      !vars.listHasGenerated ||
      vars.numberOfQueriedImages !== 0
    ) {
      if (Date.now() > deadline) throw new Error("preview generation hung");
      await new Promise((r) => setTimeout(r, 10));
    }
    return service.getPreviewData();
  }

  // What preview.component.remove() does before saving.
  function markAllForRemoval() {
    const data = service.getPreviewData();
    for (const dir in data) {
      for (const user in data[dir]) {
        for (const appId in data[dir][user].apps) {
          data[dir][user].apps[appId].status = "remove";
        }
      }
    }
  }

  return { service, log, generate, markAllForRemoval };
}

// Everything SRM writes for one Steam user, in a comparable form.
export function readSteamUserState(steamDir: string, accountId: string) {
  const config = path.join(steamDir, "userdata", accountId, "config");
  const readJson = (file: string) =>
    fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const shortcutsFile = path.join(config, "shortcuts.vdf");
  const grid = path.join(config, "grid");
  const cloudFile = path.join(
    config,
    "cloudstorage",
    "cloud-storage-namespace-1.json",
  );
  const configVdf = path.join(steamDir, "config", "config.vdf");
  return {
    shortcuts: fs.existsSync(shortcutsFile)
      ? shortcutsParser.parseBuffer(fs.readFileSync(shortcutsFile)).shortcuts
      : null,
    addedItems: readJson(path.join(config, "addedItemsV2.json")),
    grid: fs.existsSync(grid)
      ? fs
          .readdirSync(grid, { withFileTypes: true })
          .map((e) => `${e.name}${e.isSymbolicLink() ? " (symlink)" : ""}`)
          .sort()
      : [],
    collections: (readJson(cloudFile) ?? [])
      .filter((item: any) => item[0].startsWith("user-collections."))
      .map((item: any) => ({
        key: item[0],
        is_deleted: item[1].is_deleted,
        value: item[1].value ? JSON.parse(item[1].value) : undefined,
      })),
    compatToolMapping: fs.existsSync(configVdf)
      ? ((genericParser.parse(fs.readFileSync(configVdf, "utf8")) as any)
          ?.InstallConfigStore?.Software?.Valve?.Steam?.CompatToolMapping ??
        null)
      : null,
  };
}
