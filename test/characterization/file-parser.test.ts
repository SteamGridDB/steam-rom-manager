// Characterization tests: pin what FileParser produces today for realistic
// ROM-parser configs, so the modernization refactors can prove they change
// nothing. Snapshots are the contract; update them only for intended changes.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { FileParser } from "../../src/lib/file-parser";
import { userDataDir } from "../../src/paths"; // the test stub's temp dir
import { FuzzyMatcher } from "../../src/lib/fuzzy-matcher";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  normalize,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import { sgdbCalls, sgdbFailures, sgdbIds } from "../stubs/sgdb-search";
import { fromLegacy } from "../../src/core/exceptions-format";
import { generateShortAppId } from "../../src/lib/helpers/steam/generate-app-id";

const fuzzyList = [
  "Super Mario World",
  "Chrono Trigger",
  "The Legend of Zelda: A Link to the Past",
  "Pokémon Emerald",
  "Metroid Prime",
];

function makeFileParser(customVariables = {}, exceptions = {}) {
  const fuzzyMatcher = new FuzzyMatcher(undefined, {
    totalGames: fuzzyList.length,
    games: fuzzyList,
  });
  const parser = new FileParser({ fuzzyMatcher } as any);
  parser.setCustomVariables(customVariables);
  // written in the pre-version-3 form; migrated like a user's file is
  parser.setUserExceptions(fromLegacy(exceptions));
  return parser;
}

// The fields of a parsed file that end up in Steam (shortcut, categories,
// artwork queries); `titles` records every step of the title waterfall.
function summarize(result: any) {
  return result.parsedConfigs.map((pc: any) => ({
    configurationTitle: pc.configurationTitle,
    foundUserAccounts: pc.foundUserAccounts,
    missingUserAccounts: pc.missingUserAccounts,
    failed: pc.failed,
    // (exclusion ids are random)
    excluded: pc.excluded.map(({ exclusionId, ...rest }: any) => rest),
    // glob result order is filesystem-dependent; sort for stable snapshots
    files: _.sortBy(pc.files, "filePath").map((f: any) => ({
      filePath: f.filePath,
      titles: f.titles,
      sortAsTitle: f.sortAsTitle,
      executableLocation: f.executableLocation,
      modifiedExecutableLocation: f.modifiedExecutableLocation,
      startInDirectory: f.startInDirectory,
      argumentString: f.argumentString,
      appendArgsToExecutable: f.appendArgsToExecutable,
      compatToolName: f.compatToolName,
      steamCategories: f.steamCategories,
      onlineImageQueries: f.onlineImageQueries,
      imagePool: f.imagePool,
      backupImage: _.pickBy(f.backupImage),
    })),
  }));
}

describe("FileParser (characterization)", () => {
  let root: string;
  let roms: string;
  let steamDir: string;
  let roots: { [token: string]: string };

  beforeAll(() => {
    root = tempDir("fileparser");
    roms = path.join(root, "roms");
    steamDir = makeFakeSteam(path.join(root, "steam"), [
      { accountID: "11111111", name: "alice" },
      { accountID: "22222222", name: "bob" },
    ]);
    writeFiles(roms, [
      "snes/Super Mario World (USA).sfc",
      "snes/Chrono Trigger (USA) [!].sfc",
      "snes/Zelda - A Link to the Past (USA).SFC",
      "snes/readme.txt",
      "gba/Pokemon - Emerald Version (USA, Europe).gba",
      "gba/Homebrew Thing.gba",
      "gc/Metroid Prime (USA) (Rev 2).iso",
    ]);
    roots = { ROOT: root, USERDATA: userDataDir };
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
  beforeEach(() => {
    sgdbCalls.length = 0;
    sgdbFailures.clear();
    for (const key of Object.keys(sgdbIds)) delete sgdbIds[key];
  });

  it("glob parser: title extraction, fuzzy matching, args, categories", async () => {
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "SNES 🎮",
      parserId: "snes",
      romDirectory: path.join(roms, "snes"),
      steamDirectory: steamDir,
      steamCategories: ["SNES", "Retro"],
      executable: { path: path.join(root, "emu", "snes9x.exe") },
      executableArgs: '-fullscreen "${filePath}"',
      startInDirectory: path.join(root, "emu-data"),
      parserInputs: { glob: "${title}@(.sfc|.SFC)" },
      titleModifier: "${fuzzyTitle}",
      userAccounts: { specifiedAccounts: ["alice"] },
    });
    const result = await makeFileParser().executeFileParser(
      [config],
      makeSettings(),
    );
    expect(normalize(summarize(result), roots)).toMatchSnapshot();
  });

  it("glob-regex parser: regex title, title modifier, appended args, all accounts", async () => {
    const config = makeConfig({
      parserType: "Glob-regex",
      configTitle: "GBA",
      parserId: "gba",
      romDirectory: path.join(roms, "gba"),
      steamDirectory: steamDir,
      executable: {
        path: path.join(root, "emu", "mgba"),
        appendArgsToExecutable: true,
      },
      executableArgs: '${/.*/|${filePath}|"$&"}',
      parserInputs: { "glob-regex": "${/(.+?)(?: \\(.*\\))?\\.gba$/}" },
      titleModifier: "${uc|${fuzzyTitle}} [GBA]",
      userAccounts: { specifiedAccounts: [] },
      onlineImageQueries: ["${fuzzyTitle}", "${title}"],
    });
    const result = await makeFileParser().executeFileParser(
      [config],
      makeSettings(),
    );
    expect(normalize(summarize(result), roots)).toMatchSnapshot();
  });

  it("rules made on Add Games match one game by app id (not its title)", async () => {
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "SNES",
      parserId: "snes-ids",
      romDirectory: path.join(roms, "snes"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "snes9x.exe") },
      parserInputs: { glob: "${title}.@(sfc|SFC)" },
      userAccounts: { specifiedAccounts: ["alice"] },
    });
    const first = await makeFileParser().executeFileParser(
      [config],
      makeSettings(),
    );
    const files = first.parsedConfigs[0].files;
    const idOf = (title: string) => {
      const f = files.find((x: any) => x.titles.extracted.startsWith(title));
      return generateShortAppId(
        f.modifiedExecutableLocation,
        f.titles.extracted,
      );
    };
    const parser = makeFileParser();
    parser.setUserExceptions({
      exceptions: [
        {
          id: "e1",
          matchAppId: idOf("Chrono"),
          appTitle: "Chrono Trigger (USA) [!]",
          timeStamp: 1,
          newTitle: "",
          searchTitle: "",
          sgdbId: "42", // picked with Fix match
          commandLineArguments: "",
          excludeArtwork: false,
        },
        // a title rule for the same game: the app id rule wins
        {
          id: "e2",
          matchTitle: "Chrono Trigger (USA) [!]",
          timeStamp: 1,
          newTitle: "Not This",
          searchTitle: "",
          sgdbId: "",
          commandLineArguments: "",
          excludeArtwork: false,
        },
      ],
      exclusions: [
        {
          id: "x1",
          matchAppId: idOf("Zelda"),
          appTitle: "Zelda",
          timeStamp: 1,
        },
      ],
    });
    const result = await parser.executeFileParser([config], makeSettings());
    const parsed = result.parsedConfigs[0];
    const chrono = parsed.files.find((f: any) =>
      f.titles.extracted.startsWith("Chrono"),
    );
    expect(chrono.onlineImageQueries).toEqual(["${gameid:42}"]);
    expect(chrono.imagePool).toBe("${gameid:42}");
    expect(chrono.titles.final ?? chrono.titles.extracted).not.toBe("Not This");
    expect(parsed.excluded).toEqual([
      expect.objectContaining({ exclusionId: "x1", title: "Zelda" }),
    ]);
    expect(parsed.files.map((f: any) => f.titles.extracted).sort()).toEqual([
      "Chrono Trigger (USA) [!]",
      "Super Mario World (USA)",
    ]);
  });

  it("custom variables, user exceptions and missing accounts", async () => {
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "GameCube",
      parserId: "gc",
      romDirectory: path.join(roms, "gc"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "dolphin.exe") },
      executableArgs: '-b -e "${filePath}"',
      parserInputs: { glob: "${title}.iso" },
      titleFromVariable: { limitToGroups: ["gcTitles"] },
      userAccounts: { specifiedAccounts: ["alice", "carol"] },
    });
    const snes = makeConfig({
      parserType: "Glob",
      configTitle: "SNES excluded",
      parserId: "snes2",
      romDirectory: path.join(roms, "snes"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "snes9x.exe") },
      parserInputs: { glob: "${title}.@(sfc|SFC)" },
      userAccounts: { specifiedAccounts: ["bob"] },
    });
    const parser = makeFileParser(
      { gcTitles: { "Metroid Prime (USA) (Rev 2)": "Metroid Prime (GC)" } },
      {
        "Super Mario World (USA)": {
          newTitle: "",
          searchTitle: "",
          timeStamp: 0,
          commandLineArguments: "",
          exclude: true,
          excludeArtwork: false,
        },
        "Chrono Trigger (USA) [!]": {
          newTitle: "Chrono Trigger (Renamed)",
          searchTitle: "",
          timeStamp: 0,
          commandLineArguments: "--custom",
          exclude: false,
          excludeArtwork: false,
          compatToolName: "proton_9",
        },
      },
    );
    const result = await parser.executeFileParser(
      [config, snes],
      makeSettings(),
    );
    expect(normalize(summarize(result), roots)).toMatchSnapshot();
  });

  it("drmProtect: resolves local artwork backups via SteamGridDB ids", async () => {
    sgdbIds["Metroid Prime (USA) (Rev 2)"] = [4242];
    writeFiles(path.join(userDataDir, "artworkBackups"), [
      "tall/4242.png",
      "hero/4242.webp",
    ]);
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "One game",
      romDirectory: path.join(roms, "gc"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "dolphin.exe") },
      parserInputs: { glob: "${title}.iso" },
      onlineImageQueries: ["${title}"],
      drmProtect: true,
    });
    const result = await makeFileParser().executeFileParser(
      [config],
      makeSettings(),
    );
    expect(normalize(summarize(result), roots)).toMatchSnapshot();
    // One lookup per file, shared by every artwork type.
    expect(sgdbCalls).toEqual([
      {
        method: "retrieveIdsFromTitle",
        title: "Metroid Prime (USA) (Rev 2)",
      },
    ]);
  });

  it("drmProtect: an unreachable SteamGridDB means no backups, not a hang", async () => {
    sgdbFailures.add("Metroid Prime (USA) (Rev 2)");
    const config = makeConfig({
      parserType: "Glob",
      configTitle: "Offline",
      romDirectory: path.join(roms, "gc"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "dolphin.exe") },
      parserInputs: { glob: "${title}.iso" },
      onlineImageQueries: ["${title}"],
      drmProtect: true,
    });
    const result = await makeFileParser().executeFileParser(
      [config],
      makeSettings(),
    );
    const [file] = result.parsedConfigs[0].files;
    expect(file.titles.final).toBe("Metroid Prime");
    expect(_.pickBy(file.backupImage)).toEqual({});
  });
});
