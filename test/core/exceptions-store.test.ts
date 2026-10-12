import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as paths from "../../src/paths";
import * as modifiers from "../../src/core/modifiers";
import { ExceptionsStore } from "../../src/core/exceptions-store";
import { generateShortAppId } from "../../src/lib/helpers/steam/generate-app-id";
import { makeLogger } from "../helpers/services-harness";

const exception = (extra: object = {}) => ({
  newTitle: "",
  searchTitle: "",
  timeStamp: 1,
  commandLineArguments: "",
  exclude: false,
  excludeArtwork: false,
  ...extra,
});
const onDisk = () =>
  JSON.parse(fs.readFileSync(paths.userExceptions, "utf8")).titles;

describe("ExceptionsStore", () => {
  beforeEach(() => fs.rmSync(paths.userExceptions, { force: true }));

  it("loads, validates and migrates a file", async () => {
    fs.writeFileSync(
      paths.userExceptions,
      JSON.stringify({
        exceptionsVersion: modifiers.userExceptions.latestVersion,
        titles: { "Some Game": exception({ newTitle: "Renamed" }) },
      }),
    );
    const store = new ExceptionsStore(makeLogger().service);
    const data = await store.load();
    expect(data.titles["Some Game"].newTitle).toBe("Renamed");
    expect(store.savingIsDisabled).toBe(false);
  });

  it("never overwrites an unreadable file", async () => {
    fs.writeFileSync(paths.userExceptions, "nope");
    const { service, log } = makeLogger();
    const store = new ExceptionsStore(service);
    await store.load();
    expect(log.some((l) => l.level === "error")).toBe(true);
    expect(store.addById("1", "X", exception())).toBe(false);
    expect(fs.readFileSync(paths.userExceptions, "utf8")).toBe("nope");
  });

  it("adds, finds, replaces and deletes exceptions by id", async () => {
    const store = new ExceptionsStore(makeLogger().service);
    await store.load();
    const id = store.makeExceptionId('"/emu/a"', "Game A", "Glob");
    expect(id).toBe(generateShortAppId('"/emu/a"', "Game A"));
    expect(store.makeExceptionId('"220"', "Half-Life 2", "Steam")).toBe("220");

    store.addById(id, "Game A", exception({ newTitle: "First" }));
    store.addById(id, "Game A", exception({ newTitle: "Second" }));
    expect(Object.keys(onDisk())).toEqual([`Game A \${id:${id}}`]);
    expect(store.getById(id).newTitle).toBe("Second");

    store.deleteById(id);
    expect(store.getById(id)).toBeUndefined();
    expect(onDisk()).toEqual({});
  });

  it("putBack un-excludes, or drops an exception with nothing else set", async () => {
    const store = new ExceptionsStore(makeLogger().service);
    await store.load();
    store.save({
      titles: {
        Plain: exception({ exclude: true }),
        Renamed: exception({ exclude: true, newTitle: "R" }),
      },
    });
    store.putBack("Plain");
    store.putBack("Renamed");
    expect(onDisk()).toEqual({ Renamed: exception({ newTitle: "R" }) });
  });

  it("refuses to save duplicate keys for the same id", async () => {
    const { service, log } = makeLogger();
    const store = new ExceptionsStore(service);
    await store.load();
    expect(
      store.save({
        titles: {
          "Old Title ${id:123}": exception(),
          "New Title ${id:123}": exception(),
        },
      }),
    ).toBe(false);
    expect(fs.existsSync(paths.userExceptions)).toBe(false);
    expect(log.some((l) => l.message.includes("${id:123}"))).toBe(true);
  });
});
