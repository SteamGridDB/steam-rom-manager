// The GUI's preview path: PreviewService (renderer) keeps the list and runs
// the PreviewEngine; building the list, artwork lookups and writing to Steam
// go over (simulated, structured-cloning) IPC to a Core in "main".
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as paths from "../../src/paths";
import { Core } from "../../src/core/core";
import { hostCore } from "../../src/core/rpc-host";
import { CoreClient } from "../../src/renderer/core-client";
import { SettingsService } from "../../src/renderer/services/settings.service";
import { ParsersService } from "../../src/renderer/services/parsers.service";
import { ImageProviderService } from "../../src/renderer/services/image-provider.service";
import { PreviewService } from "../../src/renderer/services/preview.service";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import {
  loaded,
  makeLogger,
  settleCoresAfterEach,
} from "../helpers/services-harness";
import { makeRpcPair } from "../helpers/rpc-pair";
import { makeFakeNetwork } from "../helpers/fake-network";
import {
  readSteamUserState,
  startImageServer,
} from "../helpers/preview-harness";

describe("preview over IPC (GUI path)", () => {
  let imageServer: Awaited<ReturnType<typeof startImageServer>>;
  let root: string;
  let steamDir: string;

  beforeAll(async () => {
    imageServer = await startImageServer();
  });
  afterAll(() => imageServer.close());
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    root = tempDir("ipc-preview");
    steamDir = makeFakeSteam(
      path.join(root, "steam"),
      [{ accountID: "11111111", name: "alice" }],
      { userContent: true },
    );
    writeFiles(root, [
      "roms/Super Mario World (USA).sfc",
      "roms/Chrono Trigger (USA).sfc",
      "emu/snes9x.exe",
    ]);
    for (const f of fs.readdirSync(paths.userDataDir)) {
      fs.rmSync(path.join(paths.userDataDir, f), {
        recursive: true,
        force: true,
      });
    }
    fs.writeFileSync(
      paths.userSettings,
      JSON.stringify(
        makeSettings({
          environmentVariables: {
            steamDirectory: steamDir,
            userAccounts: ["alice"],
          },
        }),
      ),
    );
    fs.writeFileSync(
      paths.userConfigurations,
      JSON.stringify([
        makeConfig({
          parserType: "Glob",
          configTitle: "SNES",
          parserId: "snes",
          romDirectory: path.join(root, "roms"),
          steamDirectory: "${steamdirglobal}",
          steamCategories: ["SNES"],
          executable: { path: path.join(root, "emu", "snes9x.exe") },
          parserInputs: { glob: "${title}.sfc" },
          titleModifier: "${fuzzyTitle}",
          imageProviders: ["sgdb"],
        }),
      ]),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const settled = settleCoresAfterEach(afterEach);

  function makeUi() {
    const mainLog = makeLogger();
    const core = new Core({
      logger: mainLog.service,
      fetch: makeFakeNetwork(imageServer.base),
    });
    settled(core).start({ presets: false });
    const { host, client } = makeRpcPair();
    hostCore(core, host);
    const coreClient = { client: new CoreClient(client) } as any;
    const uiLog = makeLogger();
    const settingsService = new SettingsService(coreClient);
    const parsersService = new ParsersService(coreClient, settingsService);
    const preview = new PreviewService(
      parsersService,
      uiLog.service as any,
      new ImageProviderService(coreClient),
      settingsService,
      coreClient,
    );
    return { core, preview, parsersService, uiLog, mainLog };
  }

  const errors = (log: { level: string; message: string }[]) =>
    log.filter((l) => l.level === "error").map((l) => l.message);

  it("generates, saves and removes through the main process", async () => {
    const { core, preview, parsersService, uiLog, mainLog } = makeUi();
    await loaded(parsersService);
    await core.ready.fuzzy;

    await preview.generatePreviewData();
    await preview.engine.waitForImages();
    const data = preview.getPreviewData();
    const apps = Object.values(data[steamDir]["11111111"].apps);
    expect(apps.map((a: any) => a.title).sort()).toEqual([
      "Chrono Trigger",
      "Super Mario World",
    ]);
    // artwork found by the main process's providers is in the UI's pools
    expect(preview.getCurrentImage(apps[0] as any, "tall").imageUrl).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/grids\//,
    );

    expect(await preview.saveData({ batchWrite: true, removeAll: false })).toBe(
      true,
    );
    const added = readSteamUserState(steamDir, "11111111");
    expect(added.shortcuts.map((s: any) => s.appname).sort()).toEqual([
      "Chrono Trigger",
      "My Manual Shortcut",
      "Super Mario World",
    ]);
    expect(added.grid.filter((f: string) => f.endsWith("p.png"))).toHaveLength(
      2,
    );
    // saved artwork is now shown as the Steam image, as before
    expect(preview.getCurrentImage(apps[0] as any, "tall").imageProvider).toBe(
      "Current Artwork",
    );

    expect(await preview.removeAllInPreview()).toBe(true);
    expect(preview.getPreviewData()).toBeUndefined();
    expect(
      readSteamUserState(steamDir, "11111111").shortcuts.map(
        (s: any) => s.appname,
      ),
    ).toEqual(["My Manual Shortcut"]);
    expect(errors(uiLog.log)).toEqual([]);
    expect(errors(mainLog.log)).toEqual([]);
  });

  it("uses the settings shown in the UI, even unsaved", async () => {
    const { core, preview, parsersService } = makeUi();
    await loaded(parsersService);
    await core.ready.fuzzy;
    // e.g. a path picked in the UI that wasn't saved yet
    const settings = (preview as any).settingsService.getSettings();
    settings.environmentVariables.userAccounts = ["nobody"];
    await preview.generatePreviewData();
    expect(preview.getPreviewData()).toBeUndefined();
  });
});
