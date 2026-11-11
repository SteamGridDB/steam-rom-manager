// Characterization of the full save pipeline: PreviewService generates the
// preview from real parser output, then saves/removes/nukes into a fake Steam
// install. Snapshots pin every file SRM writes there (shortcuts.vdf,
// addedItemsV2.json, grid artwork, collections, config.vdf compat mappings),
// including that content SRM doesn't own survives.
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
import * as _ from "lodash";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  normalize,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import {
  FakeArtwork,
  makePreviewService,
  readSteamUserState,
  startImageServer,
} from "../helpers/preview-harness";
import { steamControlCalls } from "../stubs/stop-start-steam";
import { userDataDir } from "../../src/paths";
import {
  appifyShortcutId,
  generateShortcutId,
  shortenAppId,
} from "../../src/lib/helpers/steam";
import {
  wrapperArguments,
  wrapperExecutable,
} from "../../src/lib/launch-wrapper";
const shortcutsParser = require("steam-shortcut-editor");

const ACCOUNT = "11111111";
const fuzzyList = ["Super Mario World", "Chrono Trigger", "Metroid Prime"];
const artwork: FakeArtwork = {
  "Super Mario World": { gameId: "1001" },
  "Chrono Trigger": { gameId: "1002" },
};

describe("save pipeline (characterization)", () => {
  let imageServer: Awaited<ReturnType<typeof startImageServer>>;
  let root: string;
  let steamDir: string;
  let roms: string;

  beforeAll(async () => {
    imageServer = await startImageServer();
  });
  afterAll(() => imageServer.close());

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    root = tempDir("save");
    roms = path.join(root, "roms");
    steamDir = makeFakeSteam(
      path.join(root, "steam"),
      [{ accountID: ACCOUNT, name: "alice" }],
      { userContent: true },
    );
    writeFiles(roms, [
      "snes/Super Mario World (USA).sfc",
      "snes/Chrono Trigger (USA).sfc",
      "gc/Metroid Prime (USA).iso",
    ]);
    steamControlCalls.length = 0;
    imageServer.requests.length = 0;
    fs.rmSync(path.join(userDataDir, "artworkCache.json"), { force: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const snesConfig = (extra: object = {}) =>
    makeConfig({
      parserType: "Glob",
      configTitle: "SNES",
      parserId: "snes-parser",
      romDirectory: path.join(roms, "snes"),
      steamDirectory: steamDir,
      steamCategories: ["SNES", "Retro"],
      // Fixed (non-temp) exe paths keep app ids, which hash the exe path,
      // identical across runs and machines. The exe never needs to exist.
      executable: { path: "/emu/snes9x" },
      executableArgs: '"${filePath}"',
      parserInputs: { glob: "${title}.sfc" },
      titleModifier: "${fuzzyTitle}",
      compatToolName: "proton_9",
      ...extra,
    });
  const gcConfig = (extra: object = {}) =>
    makeConfig({
      parserType: "Glob",
      configTitle: "GameCube",
      parserId: "gc-parser",
      romDirectory: path.join(roms, "gc"),
      steamDirectory: steamDir,
      steamCategories: ["GameCube"],
      executable: { path: "/emu/dolphin" },
      executableArgs: '-b -e "${filePath}"',
      parserInputs: { glob: "${title}.iso" },
      titleModifier: "${fuzzyTitle}",
      ...extra,
    });

  function harness(configs: any[], settings: object = {}) {
    return makePreviewService({
      configs,
      settings: makeSettings(settings),
      knownSteamDirectories: [steamDir],
      imageBase: imageServer.base,
      artwork,
      fuzzyList,
    });
  }

  // (Icons are saved as .ico on Windows, as they come elsewhere: the
  // snapshots have the latter. "icons on Windows" tests the former.)
  const state = () => {
    const value = normalize(readSteamUserState(steamDir, ACCOUNT), {
      ROOT: root,
    });
    return process.platform === "win32"
      ? JSON.parse(JSON.stringify(value).replaceAll("_icon.ico", "_icon.png"))
      : value;
  };
  const errors = (log: { level: string; message: string }[]) =>
    log.filter((l) => l.level === "error").map((l) => l.message);

  async function addAll(configs: any[], settings: object = {}) {
    const h = harness(configs, settings);
    await h.generate();
    const ok = await h.service.saveData({ batchWrite: true, removeAll: false });
    return { ...h, ok };
  }

  it("add: writes shortcuts, artwork, collections and compat tools", async () => {
    const { ok, log } = await addAll([snesConfig(), gcConfig()]);
    expect(errors(log)).toEqual([]);
    expect(ok).toBe(true);
    expect(state()).toMatchSnapshot();
    expect(imageServer.requests.sort()).toMatchSnapshot("artwork requests");
    expect(steamControlCalls).toMatchSnapshot("steam control");
  });

  describe.runIf(process.platform === "win32")("icons on Windows", () => {
    const config = () => path.join(steamDir, "userdata", ACCOUNT, "config");
    const shortcutIcons = () =>
      shortcutsParser
        .parseBuffer(fs.readFileSync(path.join(config(), "shortcuts.vdf")))
        .shortcuts.map((s: any) => s.icon)
        .filter(Boolean);
    const isIco = (file: string) =>
      fs.readFileSync(file).readUInt32LE(0) === 0x00010000;

    it("are saved as .ico, which desktop shortcuts can show", async () => {
      const { ok, log } = await addAll([snesConfig()]);
      expect(errors(log)).toEqual([]);
      expect(ok).toBe(true);
      const icons = shortcutIcons();
      expect(icons.length).toBeGreaterThan(0);
      for (const icon of icons) {
        expect(icon).toMatch(/_icon\.ico$/);
        expect(isIco(icon)).toBe(true);
      }
    });

    it("a PNG icon saved before is saved again as .ico", async () => {
      await addAll([snesConfig()]);
      // as an older SRM left them: a PNG, named in shortcuts.vdf
      const file = path.join(config(), "shortcuts.vdf");
      const data = shortcutsParser.parseBuffer(fs.readFileSync(file));
      const pngs: string[] = [];
      for (const s of data.shortcuts) {
        if (!s.icon) continue;
        const png = s.icon.replace(/\.ico$/, ".png");
        fs.renameSync(s.icon, png);
        fs.writeFileSync(png, imageServer.png);
        s.icon = png;
        pngs.push(png);
      }
      fs.writeFileSync(file, shortcutsParser.writeBuffer(data));

      const { ok, log } = await addAll([snesConfig()]);
      expect(errors(log)).toEqual([]);
      expect(ok).toBe(true);
      expect(shortcutIcons()).toEqual(
        pngs.map((png) => png.replace(/\.png$/, ".ico")),
      );
      for (const png of pngs) {
        expect(fs.existsSync(png)).toBe(false);
        expect(isIco(png.replace(/\.png$/, ".ico"))).toBe(true);
      }
    });
  });

  it("re-saving the same list changes nothing (no duplicates)", async () => {
    await addAll([snesConfig(), gcConfig()]);
    const first = state();
    const { ok, log } = await addAll([snesConfig(), gcConfig()]);
    expect(errors(log)).toEqual([]);
    expect(ok).toBe(true);
    expect(state()).toEqual(first);
  });

  it("each shortcut with a logo gets a logo position once; one the user set is kept", async () => {
    await addAll([snesConfig(), gcConfig()]);
    const grid = path.join(steamDir, "userdata", ACCOUNT, "config", "grid");
    const positions = () =>
      fs
        .readdirSync(grid)
        .filter((name) => name.endsWith(".json"))
        .sort();
    const logos = fs
      .readdirSync(grid)
      .filter((name) => name.includes("_logo."))
      .map((name) => `${name.split("_")[0]}.json`)
      .sort();
    expect(logos.length).toBeGreaterThan(0);
    expect(positions()).toEqual(logos);

    // the user moved one logo in Steam; another's file is gone (added by
    // an older SRM): re-saving keeps the first and writes the second
    const [moved, missing] = logos;
    fs.writeFileSync(path.join(grid, moved), "mine");
    fs.rmSync(path.join(grid, missing));
    const { ok, log } = await addAll([snesConfig(), gcConfig()]);
    expect(errors(log)).toEqual([]);
    expect(ok).toBe(true);
    expect(positions()).toEqual(logos);
    expect(fs.readFileSync(path.join(grid, moved), "utf8")).toBe("mine");
  });

  it("collections are updated in place; untouched user collections aren't rewritten", async () => {
    const cloudFile = path.join(
      steamDir,
      "userdata",
      ACCOUNT,
      "config",
      "cloudstorage",
      "cloud-storage-namespace-1.json",
    );
    const entry = (key: string) =>
      JSON.parse(fs.readFileSync(cloudFile, "utf8")).filter(
        (item: any) => item[0] === key,
      );
    const original = entry("user-collections.uc-mine");

    // Unrelated categories: the user's collection entry is left exactly as is.
    await addAll([snesConfig(), gcConfig()]);
    expect(entry("user-collections.uc-mine")).toEqual(original);

    // A category matching the user's collection (case-insensitively) adds
    // SRM's games into it, updating that one entry in place.
    await addAll([snesConfig({ steamCategories: ["my collection"] })]);
    const [updated] = entry("user-collections.uc-mine");
    expect(entry("user-collections.uc-mine")).toHaveLength(1);
    const snesIds = state()
      .shortcuts.filter((s: any) => s.exe === '"/emu/snes9x"')
      .map((s: any) => s.appid >>> 0);
    expect(JSON.parse(updated[1].value).added.sort()).toEqual(
      [440, ...snesIds].sort(),
    );

    // Removing them takes them back out, still in place.
    const h = harness([snesConfig({ steamCategories: ["my collection"] })]);
    await h.generate();
    h.markAllForRemoval();
    await h.service.saveData({ batchWrite: false, removeAll: false });
    expect(entry("user-collections.uc-mine")).toHaveLength(1);
    expect(
      JSON.parse(entry("user-collections.uc-mine")[0][1].value).added,
    ).toEqual([440]);
  });

  it("a changed title replaces the old shortcut instead of duplicating it", async () => {
    await addAll([snesConfig(), gcConfig()]);
    await addAll([
      snesConfig({ titleModifier: "${fuzzyTitle} (SNES)" }),
      gcConfig(),
    ]);
    const after = state();
    expect(after.shortcuts.map((s: any) => s.appname).sort()).toEqual([
      "Chrono Trigger (SNES)",
      "Metroid Prime",
      "My Manual Shortcut",
      "Super Mario World (SNES)",
    ]);
    expect(after).toMatchSnapshot();
  });

  it("remove: drops SRM's entries and keeps the user's", async () => {
    await addAll([snesConfig(), gcConfig()]);
    const h = harness([snesConfig(), gcConfig()]);
    await h.generate();
    h.markAllForRemoval();
    const ok = await h.service.saveData({
      batchWrite: false,
      removeAll: false,
    });
    expect(errors(h.log)).toEqual([]);
    expect(ok).toBe(true);
    expect(state()).toMatchSnapshot();
  });

  describe("Non-SRM Shortcuts (artwork only)", () => {
    const shortcutsFile = () =>
      path.join(steamDir, "userdata", ACCOUNT, "config", "shortcuts.vdf");
    // The user's own shortcuts: one renamed since it was made (its appid
    // isn't the one its exe and name give), one as Steam makes them.
    const chronoExe = '"C:\\Games\\ct.exe"';
    beforeEach(() => {
      fs.writeFileSync(
        shortcutsFile(),
        shortcutsParser.writeBuffer({
          shortcuts: [
            {
              appid: -1000000002,
              AppName: "Super Mario World",
              Exe: '"C:\\Games\\smw.exe"',
              StartDir: '"C:\\Games\\"',
              icon: "C:\\Games\\smw.ico",
              AllowDesktopConfig: 1,
            },
            {
              appid: generateShortcutId(chronoExe, "Chrono Trigger"),
              AppName: "Chrono Trigger",
              Exe: chronoExe,
              StartDir: '"C:\\Games\\"',
            },
          ],
        }),
      );
    });
    const nonSrmConfig = () =>
      makeConfig({
        parserType: "Non-SRM Shortcuts",
        configTitle: "Mine",
        parserId: "non-srm-parser",
        steamDirectory: steamDir,
        titleModifier: "${fuzzyTitle}",
      });
    const shortcuts = () =>
      shortcutsParser.parseBuffer(fs.readFileSync(shortcutsFile())).shortcuts;
    const grid = () =>
      path.join(steamDir, "userdata", ACCOUNT, "config", "grid");

    it("sets the shortcut's icon to the one written, and changes nothing else", async () => {
      const { ok, log } = await addAll([nonSrmConfig()]);
      expect(errors(log)).toEqual([]);
      expect(ok).toBe(true);
      const [shortcut, chrono] = shortcuts();
      for (const s of [shortcut, chrono]) {
        expect(path.dirname(s.icon)).toBe(grid());
        expect(fs.existsSync(s.icon)).toBe(true);
      }
      // (SRM writes Steam's keys in its own casing: appname, exe)
      expect(_.omit(shortcut, "icon")).toEqual({
        appid: -1000000002,
        appname: "Super Mario World",
        exe: '"C:\\Games\\smw.exe"',
        StartDir: '"C:\\Games\\"',
        AllowDesktopConfig: true, // (as the reader gives it back)
      });
    });

    it("removing them keeps the shortcuts; the icon fields are cleared", async () => {
      await addAll([nonSrmConfig()]);
      const h = harness([nonSrmConfig()]);
      await h.generate();
      h.markAllForRemoval();
      const ok = await h.service.saveData({
        batchWrite: false,
        removeAll: false,
      });
      expect(errors(h.log)).toEqual([]);
      expect(ok).toBe(true);
      const all = shortcuts();
      expect(all.map((s: any) => [s.appname, s.icon])).toEqual([
        ["Super Mario World", ""],
        ["Chrono Trigger", ""],
      ]);
    });

    it("remove all (nuke) keeps them too; the icon fields are cleared", async () => {
      await addAll([nonSrmConfig()]);
      const h = harness([nonSrmConfig()]);
      const ok = await h.service.saveData({
        batchWrite: false,
        removeAll: true,
      });
      expect(errors(h.log)).toEqual([]);
      expect(ok).toBe(true);
      const all = shortcuts();
      expect(all.map((s: any) => [s.appname, s.icon])).toEqual([
        ["Super Mario World", ""],
        ["Chrono Trigger", ""],
      ]);
    });
  });

  describe("script wrapper", () => {
    const wrapped = (enabled = true) =>
      snesConfig({
        compatToolName: "",
        scriptWrapper: {
          enabled,
          preLaunch: { script: "/scripts/before.sh", delay: 2 },
          postLaunch: { script: "", delay: 0 },
          postExit: { script: "", delay: 0 },
        },
      });
    const shortcuts = () =>
      shortcutsParser.parseBuffer(
        fs.readFileSync(
          path.join(steamDir, "userdata", ACCOUNT, "config", "shortcuts.vdf"),
        ),
      ).shortcuts as any[];
    const wrapperDir = path.join(userDataDir, "launch-wrappers", ACCOUNT);
    const wrapperFiles = () =>
      fs.existsSync(wrapperDir) ? fs.readdirSync(wrapperDir).sort() : [];
    beforeEach(() => fs.rmSync(wrapperDir, { recursive: true, force: true }));

    it("a wrapped game's shortcut runs its file, which has the game's command", async () => {
      const { ok, log } = await addAll([wrapped()]);
      expect(errors(log)).toEqual([]);
      expect(ok).toBe(true);
      const mine = shortcuts().filter(
        (s) => s.appname !== "My Manual Shortcut",
      );
      expect(mine).toHaveLength(2);
      expect(wrapperFiles()).toHaveLength(2);
      for (const s of mine) {
        expect(s.exe).toBe(wrapperExecutable());
        const file = path.join(
          wrapperDir,
          `${shortenAppId(appifyShortcutId(s.appid))}${process.platform === "win32" ? ".ps1" : ".sh"}`,
        );
        expect(s.LaunchOptions).toBe(wrapperArguments(file));
        const content = fs.readFileSync(file, "utf8");
        expect(content).toContain(s.appname.replace(/'/g, ""));
        expect(content).toContain("snes9x");
        expect(content).toContain("before.sh");
      }
      expect(
        fs.existsSync(
          path.join(userDataDir, "launch-wrappers", "srm-launch.ps1"),
        ),
      ).toBe(true);
    });

    it("turning it off replaces the shortcuts and removes the files; so does removing", async () => {
      await addAll([wrapped()]);
      expect(wrapperFiles()).toHaveLength(2);
      const { ok } = await addAll([wrapped(false)]);
      expect(ok).toBe(true);
      const mine = shortcuts().filter(
        (s) => s.appname !== "My Manual Shortcut",
      );
      expect(mine.map((s) => s.exe)).toEqual([
        '"/emu/snes9x"',
        '"/emu/snes9x"',
      ]);
      expect(wrapperFiles()).toEqual([]);

      await addAll([wrapped()]);
      expect(wrapperFiles()).toHaveLength(2);
      const h = harness([wrapped()]);
      await h.generate();
      h.markAllForRemoval();
      expect(
        await h.service.saveData({ batchWrite: false, removeAll: false }),
      ).toBe(true);
      expect(wrapperFiles()).toEqual([]);
    });
  });

  it("nuke: removes everything SRM added, keeps the user's", async () => {
    await addAll([snesConfig(), gcConfig()]);
    const h = harness([snesConfig(), gcConfig()]);
    const ok = await h.service.saveData({ batchWrite: false, removeAll: true });
    expect(errors(h.log)).toEqual([]);
    expect(ok).toBe(true);
    const after = state();
    // SRM's forced Proton mappings go; the user's own mapping (440) stays.
    expect(Object.keys(after.compatToolMapping)).toEqual(["440"]);
    expect(after).toMatchSnapshot();
  });

  it("disabled parser: shortcuts kept by default", async () => {
    await addAll([snesConfig(), gcConfig()]);
    await addAll([snesConfig(), gcConfig({ disabled: true })]);
    expect(
      state()
        .shortcuts.map((s: any) => s.appname)
        .sort(),
    ).toEqual([
      "Chrono Trigger",
      "Metroid Prime",
      "My Manual Shortcut",
      "Super Mario World",
    ]);
  });

  it("disabled parser: shortcuts removed with deleteDisabledShortcuts", async () => {
    await addAll([snesConfig(), gcConfig()]);
    await addAll([snesConfig(), gcConfig({ disabled: true })], {
      previewSettings: { deleteDisabledShortcuts: true },
    });
    const after = state();
    expect(after.shortcuts.map((s: any) => s.appname).sort()).toEqual([
      "Chrono Trigger",
      "My Manual Shortcut",
      "Super Mario World",
    ]);
    // addedItemsV2 intentionally keeps tracking the removed shortcut
    // (conservative: never forget an id SRM might still own).
    expect(after).toMatchSnapshot();
  });
});
