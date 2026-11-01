import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as paths from "../../src/paths";
import { SettingsStore } from "../../src/core/settings-store";
import * as modifiers from "../../src/core/modifiers";
import { makeLogger } from "../helpers/services-harness";

describe("SettingsStore", () => {
  beforeEach(() => fs.rmSync(paths.userSettings, { force: true }));

  const errors = (log: { level: string }[]) =>
    log.filter((l) => l.level === "error");

  it("uses defaults without a settings file, and saves them", async () => {
    const { service: logger, log } = makeLogger();
    const store = new SettingsStore(logger);
    const settings = await store.load();
    expect((settings as any).version).toBe(modifiers.appSettings.latestVersion);
    expect(errors(log)).toEqual([]);
    settings.batchDownloadSize = 7;
    await store.save();
    const written = JSON.parse(fs.readFileSync(paths.userSettings, "utf8"));
    expect(written.batchDownloadSize).toBe(7);
  });

  it("keeps a valid file", async () => {
    fs.writeFileSync(
      paths.userSettings,
      JSON.stringify({
        version: modifiers.appSettings.latestVersion,
        offlineMode: true,
        batchDownloadSize: 12,
      }),
    );
    const store = new SettingsStore(makeLogger().service);
    const settings = await store.load();
    expect(settings.offlineMode).toBe(true);
    expect(settings.batchDownloadSize).toBe(12);
    expect(store.savingIsDisabled).toBe(false);
  });

  it("never overwrites a schema-invalid file", async () => {
    const original = JSON.stringify({
      version: modifiers.appSettings.latestVersion,
      batchDownloadSize: "lots",
    });
    fs.writeFileSync(paths.userSettings, original);
    const { service: logger, log } = makeLogger();
    const store = new SettingsStore(logger);
    await store.load();
    expect(errors(log).length).toBeGreaterThan(0);
    await store.save();
    expect(fs.readFileSync(paths.userSettings, "utf8")).toBe(original);
  });

  it("never overwrites an unreadable file (was: reset to defaults on next save)", async () => {
    fs.writeFileSync(paths.userSettings, '{ "offlineMode": tr');
    const { service: logger, log } = makeLogger();
    const store = new SettingsStore(logger);
    await store.load();
    expect(errors(log).length).toBeGreaterThan(0);
    await store.save();
    expect(fs.readFileSync(paths.userSettings, "utf8")).toBe(
      '{ "offlineMode": tr',
    );
  });

  it("notifies change listeners", async () => {
    const store = new SettingsStore(makeLogger().service);
    await store.load();
    const seen: number[] = [];
    const off = store.onChange((s) => seen.push(s.batchDownloadSize));
    store.get().batchDownloadSize = 3;
    store.changed();
    off();
    store.changed();
    expect(seen).toEqual([3]);
  });
});
