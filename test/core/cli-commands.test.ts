// The CLI commands run headless through Core, end to end: userData on disk,
// a fake Steam install, and one fake fetch standing in for GitHub and
// SteamGridDB (artwork itself comes from a local HTTP server).
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
import * as cli from "../../src/core/cli-commands";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  normalize,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import { makeLogger } from "../helpers/services-harness";
import { makeFakeNetwork } from "../helpers/fake-network";
import {
  readSteamUserState,
  startImageServer,
} from "../helpers/preview-harness";

const ACCOUNT = "11111111";

describe("CLI commands (headless Core)", () => {
  let imageServer: Awaited<ReturnType<typeof startImageServer>>;
  let root: string;
  let steamDir: string;
  const out = { lines: [] as string[], inline: [] as string[] };
  const output: cli.CliOutput = {
    log: (line) => out.lines.push(line),
    inline: (line) => out.inline.push(line),
  };

  beforeAll(async () => {
    imageServer = await startImageServer();
  });
  afterAll(() => imageServer.close());

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    out.lines.length = 0;
    out.inline.length = 0;
    root = tempDir("cli");
    steamDir = makeFakeSteam(
      path.join(root, "steam"),
      [{ accountID: ACCOUNT, name: "alice" }],
      { userContent: true },
    );
    writeFiles(root, [
      "roms/Super Mario World (USA).sfc",
      "roms/Chrono Trigger (USA).sfc",
      "emu/snes9x.exe",
    ]);
    for (const file of fs.readdirSync(paths.userDataDir)) {
      fs.rmSync(path.join(paths.userDataDir, file), {
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
          configTitle: "Snes9x (SNES) 📺",
          parserId: "snes",
          romDirectory: path.join(root, "roms"),
          steamDirectory: "${steamdirglobal}",
          steamCategories: ["SNES"],
          executable: { path: path.join(root, "emu", "snes9x.exe") },
          executableArgs: '"${filePath}"',
          parserInputs: { glob: "${title}.sfc" },
          titleModifier: "${fuzzyTitle}",
          imageProviders: ["sgdb"],
        }),
        makeConfig({
          parserType: "Glob",
          configTitle: "Other",
          parserId: "other",
          disabled: true,
          romDirectory: path.join(root, "roms"),
          steamDirectory: "${steamdirglobal}",
          executable: { path: path.join(root, "emu", "snes9x.exe") },
          parserInputs: { glob: "${title}.nope" },
        }),
      ]),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  async function loadCore() {
    const logger = makeLogger();
    const core = new Core({
      logger: logger.service,
      fetch: makeFakeNetwork(imageServer.base),
    });
    await core.load({ presets: false });
    return { core, log: logger.log };
  }
  const state = () =>
    normalize(readSteamUserState(steamDir, ACCOUNT), { ROOT: root });

  it("list and enable/disable by id, emoji-stripped name, or all", async () => {
    const { core } = await loadCore();
    expect(cli.list(core).map((c) => [c.configTitle, c.disabled])).toEqual([
      ["Snes9x (SNES) 📺", false],
      ["Other", true],
    ]);
    await cli.setEnabled(core, output, false, {
      all: false,
      names: true,
      parsers: ["Snes9x (SNES) ", "Nope"],
    });
    await cli.setEnabled(core, output, true, {
      all: false,
      names: false,
      parsers: ["other", "missing-id"],
    });
    expect(out.lines).toEqual([
      "Could not find parser Nope",
      "Disabled parser snes",
      "Enabled parser other",
      "Could not enable missing-id. No such parser exists.",
    ]);
    const saved = JSON.parse(fs.readFileSync(paths.userConfigurations, "utf8"));
    expect(saved.map((c: any) => c.disabled)).toEqual([true, false]);
    await cli.setEnabled(core, output, true, {
      all: true,
      names: false,
      parsers: [],
    });
    expect(cli.list(core).every((c) => !c.disabled)).toBe(true);
  });

  it("add writes shortcuts, artwork and categories; remove takes them out", async () => {
    const { core, log } = await loadCore();
    expect(await cli.add(core, output)).toBe(true);
    expect(log.filter((l) => l.level === "error")).toEqual([]);
    expect(out.lines).toEqual([
      "Generating app list",
      "",
      "Adding app list to steam",
    ]);
    expect(out.inline.at(0)).toMatch(/^Apps: 2\. Remaining images: \d+$/);
    const added = state();
    expect(added.shortcuts.map((s: any) => s.appname).sort()).toEqual([
      "Chrono Trigger",
      "My Manual Shortcut",
      "Super Mario World",
    ]);
    expect(added.grid.filter((f: string) => f.endsWith("p.png"))).toHaveLength(
      2,
    );
    expect(
      added.collections.find((c: any) => c.value?.name === "SNES").value.added,
    ).toHaveLength(2);

    // a fresh process removes what the previous run added
    out.lines.length = 0;
    const second = await loadCore();
    expect(await cli.remove(second.core, output)).toBe(true);
    expect(out.lines).toEqual([
      "Generating app list",
      "",
      "Removing app list from steam",
    ]);
    const removed = state();
    expect(removed.shortcuts.map((s: any) => s.appname)).toEqual([
      "My Manual Shortcut",
    ]);
    expect(removed.grid).toEqual([]);
  });

  it("nuke removes everything SRM added", async () => {
    const { core } = await loadCore();
    await cli.add(core, output);
    const second = await loadCore();
    expect(await cli.nuke(second.core, output)).toBe(true);
    const after = state();
    expect(after.shortcuts.map((s: any) => s.appname)).toEqual([
      "My Manual Shortcut",
    ]);
    expect(after.addedItems.addedApps).toEqual({});
  });

  it("nuke without any known Steam directory fails cleanly (was: CLI hung)", async () => {
    fs.writeFileSync(paths.userConfigurations, "[]");
    fs.writeFileSync(paths.userSettings, JSON.stringify(makeSettings()));
    const { core, log } = await loadCore();
    expect(await cli.nuke(core, output)).toBe(false);
    expect(log.some((l) => l.level === "error")).toBe(true);
  });

  it("add with nothing to add says so", async () => {
    fs.rmSync(path.join(root, "roms"), { recursive: true });
    fs.mkdirSync(path.join(root, "roms"));
    const { core } = await loadCore();
    expect(await cli.add(core, output)).toBe(true);
    expect(out.lines).toEqual(["Generating app list", "No apps found"]);
  });
});
