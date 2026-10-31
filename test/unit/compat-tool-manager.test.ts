import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as genericParser from "@node-steam/vdf";
import { CompatToolManager } from "../../src/lib/compat-tool-manager";
import {
  generateAppId,
  shortenAppId,
} from "../../src/lib/helpers/steam/generate-app-id";
import { tempDir } from "../helpers/fixtures";

const srmA = generateAppId('"/emu/a"', "Game A");
const srmB = generateAppId('"/emu/b"', "Game B");

function configVdf(mapping: object | null) {
  const steam: any = {};
  if (mapping) steam.CompatToolMapping = mapping;
  return genericParser.stringify({
    InstallConfigStore: { Software: { Valve: { Steam: steam } } },
  });
}

describe("CompatToolManager.removeAll", () => {
  let steamDir: string;
  let configPath: string;
  const manager = new CompatToolManager({ error: () => {} } as any);

  beforeEach(() => {
    steamDir = tempDir("compat");
    configPath = path.join(steamDir, "config", "config.vdf");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  });
  afterEach(() => fs.rmSync(steamDir, { recursive: true, force: true }));

  const mapping = () =>
    (genericParser.parse(fs.readFileSync(configPath, "utf8")) as any)
      .InstallConfigStore.Software.Valve.Steam.CompatToolMapping;

  it("removes only the mappings of the given SRM shortcuts", async () => {
    fs.writeFileSync(
      configPath,
      configVdf({
        [shortenAppId(srmA)]: { name: "proton_9", config: "", priority: "250" },
        [shortenAppId(srmB)]: { name: "proton_9", config: "", priority: "250" },
        "440": { name: "proton_8", config: "", priority: "250" },
      }),
    );
    await manager.removeAll([steamDir], { [steamDir]: { "123": [srmA] } });
    expect(Object.keys(mapping()).sort()).toEqual(
      ["440", shortenAppId(srmB)].sort(),
    );
    expect(fs.existsSync(configPath + ".backup")).toBe(true);
  });

  it("leaves config.vdf untouched when there is nothing to remove", async () => {
    const original = configVdf({
      "440": { name: "proton_8", config: "", priority: "250" },
    });
    fs.writeFileSync(configPath, original);
    await manager.removeAll([steamDir], { [steamDir]: { "123": [srmA] } });
    expect(fs.readFileSync(configPath, "utf8")).toBe(original);
    expect(fs.existsSync(configPath + ".backup")).toBe(false);
  });

  it("does not create a CompatToolMapping section", async () => {
    const original = configVdf(null);
    fs.writeFileSync(configPath, original);
    await manager.removeAll([steamDir], { [steamDir]: { "123": [srmA] } });
    expect(fs.readFileSync(configPath, "utf8")).toBe(original);
  });

  it("is a no-op without config.vdf", async () => {
    await manager.removeAll([steamDir], { [steamDir]: { "123": [srmA] } });
    expect(fs.existsSync(configPath)).toBe(false);
  });
});
