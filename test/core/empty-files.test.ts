// Empty data files (what a crash mid-save left behind before writes were
// atomic) read as missing: fresh data, saving still on. Corrupt ones still
// turn saving off, so they aren't saved over.
import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as paths from "../../src/paths";
import { SettingsStore } from "../../src/core/settings-store";
import { ParsersStore } from "../../src/core/parsers-store";
import { VDF_AddedItemsFile } from "../../src/lib/vdf-added-items-file";
import { makeLogger } from "../helpers/services-harness";
import { tempDir } from "../helpers/fixtures";

const errors = (log: { level: string }[]) =>
  log.filter((l) => l.level === "error");

describe("empty data files", () => {
  beforeEach(() => {
    fs.mkdirSync(paths.userDataDir, { recursive: true });
    fs.rmSync(paths.userSettings, { force: true });
    fs.rmSync(paths.userConfigurations, { force: true });
  });

  for (const contents of ["", "  \r\n"]) {
    it(`settings: ${JSON.stringify(contents)} gives defaults, saving on`, async () => {
      fs.writeFileSync(paths.userSettings, contents);
      const { service: logger, log } = makeLogger();
      const store = new SettingsStore(logger);
      await store.load();
      expect(store.savingIsDisabled).toBe(false);
      expect(errors(log)).toEqual([]);
    });

    it(`parsers: ${JSON.stringify(contents)} gives no parsers, saving on`, async () => {
      fs.writeFileSync(paths.userConfigurations, contents);
      const { service: logger, log } = makeLogger();
      const settings = new SettingsStore(logger);
      await settings.load();
      const store = new ParsersStore(logger, settings, { fuzzyMatcher: undefined });
      expect(await store.load()).toEqual([]);
      expect(store.savingIsDisabled).toBe(false);
      expect(errors(log)).toEqual([]);
    });
  }

  it("corrupt settings and parsers files still turn saving off", async () => {
    fs.writeFileSync(paths.userSettings, '{"version": 11, "offl');
    fs.writeFileSync(paths.userConfigurations, "[{");
    const { service: logger, log } = makeLogger();
    const settings = new SettingsStore(logger);
    await settings.load();
    expect(settings.savingIsDisabled).toBe(true);
    const parsers = new ParsersStore(logger, settings, { fuzzyMatcher: undefined });
    await parsers.load();
    expect(parsers.savingIsDisabled).toBe(true);
    // (the errors name the file)
    expect(errors(log).map((l: any) => String(l.message ?? l.args?.[0] ?? l))).toEqual(
      expect.arrayContaining([expect.stringContaining("userConfigurations.json")]),
    );
  });

  it("addedItemsV2: empty reads as nothing added yet; corrupt still stops the save", async () => {
    const dir = tempDir("added-items");
    const file = path.join(dir, "addedItemsV2.json");
    fs.writeFileSync(file, "");
    const added = new VDF_AddedItemsFile(file);
    expect(await added.read()).toEqual({ version: 2, addedApps: {} });
    fs.writeFileSync(file, '{"version": 2, "addedApps": {"1');
    await expect(new VDF_AddedItemsFile(file).read()).rejects.toThrow();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
