// Add Games' refresh only parses the parsers that changed (ParseCache):
// disabling drops a parser's games, enabling/editing parses just that
// parser, excluding games parses nothing, putting one back or changing an
// exception parses just the parsers concerned. Every list must equal what a
// full parse gives; a refresh with nothing changed parses everything.
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
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import { makeLogger } from "../helpers/services-harness";
import { makeFakeNetwork } from "../helpers/fake-network";
import { startImageServer } from "../helpers/preview-harness";
import { emptyExceptions, newRuleId } from "../../src/core/exceptions-format";

const ACCOUNT = "11111111";

describe("refresh reuses unchanged parsers", () => {
  let root: string;
  let imageServer: Awaited<ReturnType<typeof startImageServer>>;

  beforeAll(async () => {
    imageServer = await startImageServer();
  });
  afterAll(() => imageServer.close());

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    root = tempDir("reuse");
    const steamDir = makeFakeSteam(
      path.join(root, "steam"),
      [{ accountID: ACCOUNT, name: "alice" }],
      { userContent: true },
    );
    writeFiles(root, [
      "snes/Super Mario World (USA).sfc",
      "snes/Chrono Trigger (USA).sfc",
      "gba/Metroid Fusion (USA).gba",
      "gba/Golden Sun (USA).gba",
      "emu/emu.exe",
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
    const parser = (id: string, ext: string) =>
      makeConfig({
        parserType: "Glob",
        configTitle: id.toUpperCase(),
        parserId: id,
        romDirectory: path.join(root, id),
        steamDirectory: "${steamdirglobal}",
        steamCategories: [id],
        executable: { path: path.join(root, "emu", "emu.exe") },
        executableArgs: '"${filePath}"',
        parserInputs: { glob: `\${title}.${ext}` },
        imageProviders: ["sgdb"],
      });
    fs.writeFileSync(
      paths.userConfigurations,
      JSON.stringify([parser("snes", "sfc"), parser("gba", "gba")]),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("parses only what changed, and the list is always what a full parse gives", async () => {
    const core = new Core({
      logger: makeLogger().service,
      fetch: makeFakeNetwork(imageServer.base),
    });
    await core.load({ presets: false });
    const parse = vi.spyOn(core.parsers.fileParser, "executeFileParser");
    const parsed = () => {
      const ids = parse.mock.calls.flatMap(([configs]) =>
        configs.map((c) => c.parserId),
      );
      parse.mockClear();
      return ids.sort();
    };
    // The list's games, as "parser: title", and the excluded titles.
    const summary = (result: Awaited<ReturnType<typeof core.builder.build>>) => {
      const users = Object.values(result.previewData ?? {}).flatMap((u) =>
        Object.values(u),
      );
      return {
        apps: users
          .flatMap((u) => Object.values(u.apps))
          .map((a) => `${a.parserId}: ${a.title} [${a.steamCategories}]`)
          .sort(),
        excluded: users.flatMap((u) => u.excluded.map((e) => e.title)).sort(),
      };
    };
    // A refresh, and a full parse to compare it with.
    const refresh = async () => {
      const result = summary(await core.builder.build({ reuse: true }));
      const ran = parsed();
      expect(result).toEqual(summary(await core.builder.build()));
      parsed();
      return { ...result, ran };
    };
    const index = (id: string) =>
      core.parsers.getAll().findIndex((c) => c.parserId === id);

    let r = await refresh();
    expect(r.ran).toEqual(["gba", "snes"]);
    expect(r.apps).toHaveLength(4);

    // nothing changed: everything again (picks up new or removed files)
    expect((await refresh()).ran).toEqual(["gba", "snes"]);

    // disable: its games go, nothing is parsed
    await core.parsers.setEnabled("gba", false);
    r = await refresh();
    expect(r.ran).toEqual([]);
    expect(r.apps.every((a) => a.startsWith("snes:"))).toBe(true);

    // enable it again, unchanged: its last result is used
    await core.parsers.setEnabled("gba", true);
    r = await refresh();
    expect(r.ran).toEqual([]);
    expect(r.apps).toHaveLength(4);

    // edit one parser: just that one
    const snes = core.parsers.getAll()[index("snes")];
    core.parsers.update(index("snes"), { ...snes, steamCategories: ["Nintendo"] });
    r = await refresh();
    expect(r.ran).toEqual(["snes"]);
    expect(r.apps).toContain("snes: Chrono Trigger [Nintendo]");

    // exclude a game: nothing is parsed
    const exclusion = {
      id: newRuleId(),
      matchTitle: "Chrono Trigger (USA)",
      timeStamp: 1,
    };
    const saved = core.exceptions.get() ?? emptyExceptions();
    core.exceptions.save({ ...saved, exclusions: [exclusion] });
    r = await refresh();
    expect(r.ran).toEqual([]);
    expect(r.apps.some((a) => a.includes("Chrono"))).toBe(false);
    expect(r.excluded).toEqual(["Chrono Trigger (USA)"]);

    // put it back: it was only filtered out of the kept result, so nothing
    // is parsed either
    core.exceptions.save({ ...saved, exclusions: [] });
    r = await refresh();
    expect(r.ran).toEqual([]);
    expect(r.apps).toContain("snes: Chrono Trigger [Nintendo]");

    // excluded while its parser is parsed, then put back: that parser again
    core.exceptions.save({ ...saved, exclusions: [exclusion] });
    core.parsers.update(index("snes"), {
      ...core.parsers.getAll()[index("snes")],
      steamCategories: ["SNES"],
    });
    r = await refresh();
    expect(r.ran).toEqual(["snes"]);
    expect(r.excluded).toEqual(["Chrono Trigger (USA)"]);
    core.exceptions.save({ ...saved, exclusions: [] });
    r = await refresh();
    expect(r.ran).toEqual(["snes"]);
    expect(r.apps).toContain("snes: Chrono Trigger [SNES]");

    // rename a game: just its parser
    core.exceptions.save({
      ...saved,
      exclusions: [],
      exceptions: [
        {
          id: newRuleId(),
          matchTitle: "Golden Sun (USA)",
          timeStamp: 2,
          newTitle: "Golden Sun",
          searchTitle: "",
          sgdbId: "",
          commandLineArguments: "",
          excludeArtwork: false,
        },
      ],
    });
    r = await refresh();
    expect(r.ran).toEqual(["gba"]);
    expect(r.apps).toContain("gba: Golden Sun [gba]");
  }, 60000);
});
