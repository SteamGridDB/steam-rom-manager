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

  const state = () =>
    normalize(readSteamUserState(steamDir, ACCOUNT), { ROOT: root });
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

  it("re-saving the same list changes nothing (no duplicates)", async () => {
    await addAll([snesConfig(), gcConfig()]);
    const first = state();
    const { ok, log } = await addAll([snesConfig(), gcConfig()]);
    expect(errors(log)).toEqual([]);
    expect(ok).toBe(true);
    // Known quirk (CategoryManager.doCatTask): every save re-appends non-SRM
    // collections to cloud storage instead of updating them in place, so the
    // user's collection entry is duplicated once per save. Steam collapses
    // duplicate keys when it rewrites the file (a real install shows none).
    // Compare collections by key; everything else must be identical.
    const byKey = (s: any) => ({
      ...s,
      collections: _.sortBy(
        _.uniqBy([...s.collections].reverse(), "key"),
        "key",
      ),
    });
    expect(byKey(state())).toEqual(byKey(first));
    expect(
      state().collections.filter(
        (c: any) => c.key === "user-collections.uc-mine",
      ),
    ).toHaveLength(3);
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
