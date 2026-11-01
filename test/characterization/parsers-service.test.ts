// Characterization of ParsersService: loading/saving userConfigurations.json,
// parser CRUD and ordering, groups, enable/disable (what the CLI uses) and
// which configs a run skips or rejects. These behaviours move into the core.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ParsersService } from "../../src/renderer/services/parsers.service";
import { SettingsService } from "../../src/renderer/services/settings.service";
import { Core } from "../../src/core/core";
import { hostCore } from "../../src/core/rpc-host";
import { CoreClient } from "../../src/renderer/core-client";
import { makeRpcPair } from "../helpers/rpc-pair";
import { makeFakeNetwork } from "../helpers/fake-network";
import * as paths from "../../src/paths";
import * as modifiers from "../../src/core/modifiers";
import { AppSettings } from "../../src/models";
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

describe("ParsersService (characterization)", () => {
  let root: string;
  let steamDir: string;
  let settings: AppSettings;

  beforeEach(() => {
    root = tempDir("parsers");
    steamDir = makeFakeSteam(path.join(root, "steam"), [
      { accountID: "11111111", name: "alice" },
    ]);
    writeFiles(root, ["roms/Game.sfc", "emu/emu"]);
    settings = makeSettings();
    fs.rmSync(paths.userConfigurations, { force: true });
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  const settled = settleCoresAfterEach(afterEach);

  const config = (title: string, extra: object = {}) =>
    makeConfig({
      parserType: "Glob",
      configTitle: title,
      parserId: `id-${title}`,
      romDirectory: path.join(root, "roms"),
      steamDirectory: steamDir,
      executable: { path: path.join(root, "emu", "emu") },
      parserInputs: { glob: "${title}.sfc" },
      ...extra,
    });

  function writeConfigs(configs: any) {
    fs.writeFileSync(paths.userConfigurations, JSON.stringify(configs));
  }
  const savedConfigs = () =>
    JSON.parse(fs.readFileSync(paths.userConfigurations, "utf8"));

  // The real chain the app uses: facades -> IPC (simulated, with structured
  // cloning) -> Core in the "main process", on this test's userData.
  function makeService() {
    fs.writeFileSync(paths.userSettings, JSON.stringify(settings));
    const logger = makeLogger();
    const core = new Core({ logger: logger.service, fetch: makeFakeNetwork() });
    settled(core).start({ presets: false });
    const { host, client } = makeRpcPair();
    hostCore(core, host);
    const coreClient = { client: new CoreClient(client) } as any;
    const settingsService = new SettingsService(coreClient);
    const service = new ParsersService(coreClient, settingsService);
    return { service, log: logger.log, settingsService };
  }
  const savedSettings = () =>
    JSON.parse(fs.readFileSync(paths.userSettings, "utf8"));
  const titles = (s: ParsersService) =>
    s.getUserConfigurationsArray().map((c) => c.saved.configTitle);

  describe("loading", () => {
    it("starts empty without a userConfigurations.json", async () => {
      const { service } = makeService();
      expect(await loaded(service)).toEqual([]);
      expect(fs.existsSync(paths.userConfigurations)).toBe(false);
    });

    it("loads valid configs and rewrites the file at the latest version", async () => {
      writeConfigs([config("A"), config("B")]);
      const { service, log } = makeService();
      expect((await loaded(service)).map((c) => c.configTitle)).toEqual([
        "A",
        "B",
      ]);
      expect(log.filter((l) => l.level === "error")).toEqual([]);
      for (const saved of savedConfigs()) {
        expect(saved.version).toBe(modifiers.userConfiguration.latestVersion);
      }
    });

    it("drops invalid configs, reports them, and stops saving", async () => {
      const bad = { ...config("Bad"), steamInputEnabled: "nope" };
      writeConfigs([config("A"), bad]);
      const before = fs.readFileSync(paths.userConfigurations, "utf8");
      const { service, log } = makeService();
      expect((await loaded(service)).map((c) => c.configTitle)).toEqual(["A"]);
      expect(
        log.some((l) => l.level === "error" && l.message.includes("Bad")),
      ).toBe(true);
      // saving is disabled, so the user's file (with the bad entry) survives
      await service.changeEnabledStatusAll(false);
      expect(fs.readFileSync(paths.userConfigurations, "utf8")).toBe(before);
    });

    it("an unreadable userConfigurations.json still finishes loading (was: hung forever)", async () => {
      fs.writeFileSync(paths.userConfigurations, "{ not json");
      const { service, log } = makeService();
      expect(await loaded(service, 5000)).toEqual([]);
      expect(log.some((l) => l.level === "error")).toBe(true);
      // and the user's file is never overwritten with an empty list
      await service.changeEnabledStatusAll(true);
      expect(fs.readFileSync(paths.userConfigurations, "utf8")).toBe(
        "{ not json",
      );
    });
  });

  describe("editing", () => {
    it("saveConfiguration assigns a new id, enables it, and registers its group", async () => {
      const { service, settingsService } = makeService();
      await loaded(service);
      service.saveConfiguration({
        saved: config("New", { disabled: true, group: "  Retro  " }),
        current: null,
      });
      const [saved] = service.getUserConfigurationsArray();
      expect(saved.saved.parserId).not.toBe("id-New");
      expect(saved.saved.parserId).toMatch(/^\d+$/);
      expect(saved.saved.disabled).toBe(false);
      expect(saved.saved.group).toBe("Retro");
      expect(settingsService.getSettings().parserGroups).toEqual([
        { name: "Retro", collapsed: false },
      ]);
      expect(savedSettings().parserGroups).toEqual([
        { name: "Retro", collapsed: false },
      ]);
      expect(savedConfigs().map((c: any) => c.configTitle)).toEqual(["New"]);
    });

    it("saving strips parser inputs that don't belong to the parser type", async () => {
      const { service } = makeService();
      await loaded(service);
      const c = config("A");
      (c.parserInputs as any).notAnInput = "x";
      service.saveConfiguration({ saved: c, current: null });
      expect(Object.keys(savedConfigs()[0].parserInputs)).toEqual(["glob"]);
    });

    it("reorders with swapIndex, injectIndex and moveParser", async () => {
      writeConfigs([config("A"), config("B"), config("C"), config("D")]);
      const { service } = makeService();
      await loaded(service);
      service.swapIndex(0, 3);
      expect(titles(service)).toEqual(["D", "B", "C", "A"]);
      service.injectIndex(3, 0);
      expect(titles(service)).toEqual(["A", "D", "B", "C"]);
      service.moveParser(0, 99, "Tail");
      expect(titles(service)).toEqual(["D", "B", "C", "A"]);
      expect(service.getUserConfigurationsArray()[3].saved.group).toBe("Tail");
      expect(() => service.swapIndex(0, 10)).toThrow();
      expect(savedConfigs().map((c: any) => c.configTitle)).toEqual(
        titles(service),
      );
    });

    it("deletes and restores", async () => {
      writeConfigs([config("A"), config("B")]);
      const { service } = makeService();
      await loaded(service);
      service.deleteConfiguration(0);
      expect(titles(service)).toEqual(["B"]);
      service.restoreConfiguration();
      expect(titles(service)).toEqual(["B", "A"]);
      expect(savedConfigs().map((c: any) => c.configTitle)).toEqual(["B", "A"]);
    });
  });

  describe("groups", () => {
    it("rename merges into an existing group; remove ungroups", async () => {
      settings.parserGroups = [
        { name: "One", collapsed: false },
        { name: "Two", collapsed: true },
      ];
      writeConfigs([
        config("A", { group: "One" }),
        config("B", { group: "Two" }),
      ]);
      const { service, settingsService } = makeService();
      const groups = () => settingsService.getSettings().parserGroups;
      await loaded(service);
      service.renameGroup("One", "Uno");
      expect(groups().map((g) => g.name)).toEqual(["Uno", "Two"]);
      service.renameGroup("Uno", "Two");
      expect(groups()).toEqual([{ name: "Two", collapsed: true }]);
      expect(
        service.getUserConfigurationsArray().map((c) => c.saved.group),
      ).toEqual(["Two", "Two"]);
      service.removeGroup("Two");
      expect(groups()).toEqual([]);
      expect(savedConfigs().map((c: any) => c.group)).toEqual(["", ""]);
      expect(savedSettings().parserGroups).toEqual([]);
    });

    it("enables/disables a whole group", async () => {
      writeConfigs([
        config("A", { group: "G" }),
        config("B"),
        config("C", { group: "G" }),
      ]);
      const { service } = makeService();
      await loaded(service);
      await service.changeGroupEnabledStatus("G", false);
      expect(savedConfigs().map((c: any) => c.disabled)).toEqual([
        true,
        false,
        true,
      ]);
    });
  });

  describe("enable/disable (CLI)", () => {
    it("toggles by parser id and persists", async () => {
      writeConfigs([config("A"), config("B")]);
      const { service } = makeService();
      await loaded(service);
      await service.changeEnabledStatus("id-B", false);
      expect(savedConfigs().map((c: any) => c.disabled)).toEqual([false, true]);
      await service.changeEnabledStatusAll(false);
      await service.changeEnabledStatus("id-A", true);
      expect(savedConfigs().map((c: any) => c.disabled)).toEqual([false, true]);
    });

    it("throws synchronously (a string) for an unknown id", async () => {
      writeConfigs([config("A")]);
      const { service } = makeService();
      await loaded(service);
      expect(() => service.changeEnabledStatus("nope", true)).toThrow(
        "Could not enable nope. No such parser exists.",
      );
    });
  });

  describe("running parsers", () => {
    it("skips disabled configs and reports invalid ones", async () => {
      writeConfigs([
        config("Good"),
        config("Off", { disabled: true }),
        config("Broken", { romDirectory: path.join(root, "missing") }),
      ]);
      const { service } = makeService();
      await loaded(service);
      const result = await service.executeFileParser();
      expect(result.skipped).toEqual(["Off"]);
      expect(result.invalid).toEqual(["Broken"]);
      expect(
        result.parsedData.parsedConfigs.map((c) => c.configurationTitle),
      ).toEqual(["Good"]);
    });

    it("lists known Steam directories from configs and settings", async () => {
      settings.environmentVariables.steamDirectory = "/global/steam";
      writeConfigs([config("A"), config("B")]);
      const { service } = makeService();
      await loaded(service);
      expect(service.getKnownSteamDirectories()).toEqual([
        steamDir,
        "/global/steam",
      ]);
    });
  });
});
