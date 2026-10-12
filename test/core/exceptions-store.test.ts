import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as paths from "../../src/paths";
import { ExceptionsStore } from "../../src/core/exceptions-store";
import { generateShortAppId } from "../../src/lib/helpers/steam/generate-app-id";
import { makeLogger } from "../helpers/services-harness";

// An entry of the pre-version-3 format ({ titles: { key: entry } }).
const legacy = (extra: object = {}) => ({
  newTitle: "",
  searchTitle: "",
  timeStamp: 1,
  commandLineArguments: "",
  exclude: false,
  excludeArtwork: false,
  ...extra,
});
const changes = (extra: object = {}) => ({
  newTitle: "",
  searchTitle: "",
  sgdbId: "",
  commandLineArguments: "",
  excludeArtwork: false,
  ...extra,
});
const onDisk = () => JSON.parse(fs.readFileSync(paths.userExceptions, "utf8"));
// Rules without their generated ids/timestamps, for comparing.
const plain = (rules: any[]) => rules.map(({ id, timeStamp, ...rest }) => rest);

async function loadStore(file?: object) {
  if (file) fs.writeFileSync(paths.userExceptions, JSON.stringify(file));
  const logger = makeLogger();
  const store = new ExceptionsStore(logger.service);
  await store.load();
  return { store, log: logger.log };
}

describe("ExceptionsStore", () => {
  beforeEach(() => fs.rmSync(paths.userExceptions, { force: true }));

  it("migrates the old format: keys become explicit matches, exclusions a list of their own", async () => {
    const { store } = await loadStore({
      exceptionsVersion: 2,
      titles: {
        "Chrono Trigger": legacy({
          newTitle: "CT",
          compatToolName: "proton_9",
        }),
        "Super Mario World ${id:123}": legacy({ searchTitle: "${gameid:42}" }),
        "Zelda ${id:456}": legacy({ exclude: true }),
        Metroid: legacy({ exclude: true, commandLineArguments: "-x" }),
      },
    });
    const data = store.get();
    expect(data.exceptionsVersion).toBe(3);
    expect(plain(data.exceptions)).toEqual([
      changes({
        matchTitle: "Chrono Trigger",
        newTitle: "CT",
        compatToolName: "proton_9",
      }),
      changes({
        matchAppId: "123",
        appTitle: "Super Mario World",
        sgdbId: "42",
      }),
      // excluded with changes: the changes are kept for when put back
      changes({ matchTitle: "Metroid", commandLineArguments: "-x" }),
    ]);
    expect(plain(data.exclusions)).toEqual([
      { matchAppId: "456", appTitle: "Zelda" },
      { matchTitle: "Metroid" },
    ]);
  });

  it("keeps per-game compat tool overrides across saving and loading (was: dropped on load)", async () => {
    const { store } = await loadStore();
    store.setGameException(
      "1",
      "Game",
      changes({ compatToolName: "proton_9" }),
    );
    const { store: reloaded } = await loadStore();
    expect(reloaded.exceptionFor("1", "Game").compatToolName).toBe("proton_9");
  });

  it("also writes the old format, and picks up an older SRM's edits to it", async () => {
    const { store } = await loadStore();
    store.setGameException("123", "Game A", changes({ sgdbId: "42" }));
    store.exclude([{ appId: "456", appTitle: "Game B" }]);
    expect(onDisk().titles).toEqual({
      "Game A ${id:123}": expect.objectContaining({
        searchTitle: "${gameid:42}",
      }),
      "Game B ${id:456}": expect.objectContaining({ exclude: true }),
    });
    // an older SRM keeps only `titles` and resets the version to 2
    const old = onDisk();
    old.titles["Added By Old SRM"] = legacy({ newTitle: "Old" });
    fs.writeFileSync(
      paths.userExceptions,
      JSON.stringify({ exceptionsVersion: 2, titles: old.titles }),
    );
    const { store: reloaded } = await loadStore();
    expect(reloaded.exceptionFor("x", "Added By Old SRM").newTitle).toBe("Old");
    expect(reloaded.exceptionFor("123", "?").sgdbId).toBe("42");
  });

  it("never overwrites an unreadable file", async () => {
    fs.writeFileSync(paths.userExceptions, "nope");
    const { store, log } = await loadStore();
    expect(log.some((l) => l.level === "error")).toBe(true);
    expect(store.setGameException("1", "X", changes({ newTitle: "Y" }))).toBe(
      false,
    );
    expect(fs.readFileSync(paths.userExceptions, "utf8")).toBe("nope");
  });

  it("sets, replaces and removes a game's exception (by app id)", async () => {
    const { store } = await loadStore();
    const id = store.makeExceptionId('"/emu/a"', "Game A", "Glob");
    expect(id).toBe(generateShortAppId('"/emu/a"', "Game A"));
    expect(store.makeExceptionId('"220"', "Half-Life 2", "Steam")).toBe("220");

    store.setGameException(id, "Game A", changes({ newTitle: "First" }));
    store.setGameException(id, "Game A", changes({ newTitle: "Second" }));
    expect(plain(onDisk().exceptions)).toEqual([
      changes({ matchAppId: id, appTitle: "Game A", newTitle: "Second" }),
    ]);
    // no changes left: removed
    store.setGameException(id, "Game A", changes());
    expect(store.exceptionFor(id, "Game A")).toBeUndefined();
    store.setGameException(id, "Game A", changes({ newTitle: "Again" }));
    store.deleteGameException(id);
    expect(onDisk().exceptions).toEqual([]);
  });

  it("excluding a game keeps its changes; putting it back doesn't touch them (was: wiped)", async () => {
    const { store } = await loadStore();
    store.setGameException("1", "Game", changes({ newTitle: "Renamed" }));
    store.exclude([
      { appId: "1", appTitle: "Game" },
      { appId: "1", appTitle: "Game" }, // twice: one exclusion
    ]);
    expect(store.get().exclusions).toHaveLength(1);
    expect(store.exceptionFor("1", "Game").newTitle).toBe("Renamed");
    store.removeExclusions([store.get().exclusions[0].id]);
    expect(store.get().exclusions).toEqual([]);
    expect(store.exceptionFor("1", "Game").newTitle).toBe("Renamed");
  });

  it("a game's own rule wins over one for its title", async () => {
    const { store } = await loadStore();
    store.save({
      exceptions: [
        {
          id: "a",
          matchTitle: "Game",
          timeStamp: 1,
          ...changes({ newTitle: "By title" }),
        },
        {
          id: "b",
          matchAppId: "1",
          appTitle: "Game",
          timeStamp: 1,
          ...changes({ newTitle: "By id" }),
        },
      ],
      exclusions: [],
    });
    expect(store.exceptionFor("1", "Game").newTitle).toBe("By id");
    expect(store.exceptionFor("2", "Game").newTitle).toBe("By title");
  });

  it("refuses rules that match a game twice, or match nothing", async () => {
    const { store, log } = await loadStore();
    const rule = (id: string, match: object) => ({
      id,
      timeStamp: 1,
      ...match,
      ...changes({ newTitle: "x" }),
    });
    expect(
      store.save({
        exceptions: [
          rule("a", { matchAppId: "1" }),
          rule("b", { matchAppId: "1" }),
        ],
        exclusions: [],
      }),
    ).toBe(false);
    expect(log.some((l) => l.message.includes("appId:1"))).toBe(true);
    expect(store.save({ exceptions: [rule("a", {})], exclusions: [] })).toBe(
      false,
    );
    expect(
      store.save({
        exceptions: [rule("a", { matchAppId: "1", matchTitle: "Both" })],
        exclusions: [],
      }),
    ).toBe(false);
    expect(fs.existsSync(paths.userExceptions)).toBe(false);
  });
});
