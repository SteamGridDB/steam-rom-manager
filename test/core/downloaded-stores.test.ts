import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as paths from "../../src/paths";
import { PresetsStore, commitLookup } from "../../src/core/presets-store";
import { CustomVariablesStore } from "../../src/core/custom-variables-store";
import { makeLogger } from "../helpers/services-harness";
import { makeFakeGithub } from "../helpers/fake-github";

const repoFile = (p: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "../..", p), "utf8"));

describe("commitLookup", () => {
  const hashes = {
    "2.4.10": { commit: "aaa" },
    "2.5.4": { commit: "bbb" },
  };
  it("pins an outdated SRM to the first matching commit", () => {
    expect(commitLookup("2.4.3", hashes)).toBe("aaa");
    expect(commitLookup("2.5.4", hashes)).toBe("bbb");
  });
  it("uses master for current versions or bad input", () => {
    expect(commitLookup("2.5.45", hashes)).toBe("master");
    expect(commitLookup("x.y", hashes)).toBe("master");
  });
});

describe("PresetsStore", () => {
  beforeEach(() => fs.rmSync(paths.configPresets, { force: true }));

  it("downloads every preset, validates and caches them", async () => {
    const github = makeFakeGithub();
    const store = new PresetsStore(makeLogger().service, github.fetch);
    const presets = await store.load();
    const presetFiles = fs
      .readdirSync(path.join(__dirname, "../../files/presets"))
      .filter((f) => f.endsWith(".json"));
    expect(Object.keys(presets).length).toBeGreaterThan(50);
    expect(Object.keys(presets)).toEqual(
      expect.arrayContaining(
        Object.keys(repoFile(`files/presets/${presetFiles[0]}`)),
      ),
    );
    expect(JSON.parse(fs.readFileSync(paths.configPresets, "utf8"))).toEqual(
      presets,
    );
    expect(store.isDownloading).toBe(false);
  });

  it("offline: loads the cache (was: empty presets, saving disabled)", async () => {
    const github = makeFakeGithub();
    await new PresetsStore(makeLogger().service, github.fetch).load();
    github.setOffline(true);
    const { service: logger, log } = makeLogger();
    const store = new PresetsStore(logger, github.fetch);
    const presets = await store.load();
    expect(Object.keys(presets).length).toBeGreaterThan(50);
    expect(store.savingIsDisabled).toBe(false);
    expect(store.isDownloading).toBe(false);
    expect(log.filter((l) => l.level === "error")).toHaveLength(1);
  });

  it("a failed download doesn't block the next one (was: stuck downloading)", async () => {
    const github = makeFakeGithub();
    github.setOffline(true);
    const store = new PresetsStore(makeLogger().service, github.fetch);
    await store.load();
    expect(store.isDownloading).toBe(false);
    github.setOffline(false);
    await store.download(true);
    expect(Object.keys(store.get()).length).toBeGreaterThan(50);
  });
});

describe("CustomVariablesStore", () => {
  beforeEach(() => {
    fs.rmSync(paths.customVariables, { force: true });
    fs.rmSync(paths.userVariables, { force: true });
  });

  it("merges the user's variables over SRM's", async () => {
    const github = makeFakeGithub();
    const [group] = Object.keys(repoFile("files/customVariables.json"));
    fs.mkdirSync(path.dirname(paths.userVariables), { recursive: true });
    fs.writeFileSync(
      paths.userVariables,
      JSON.stringify({
        [group]: { "My Odd Rom Name": "My Title" },
        "My Group": { a: "b" },
      }),
    );
    const store = new CustomVariablesStore(makeLogger().service, github.fetch);
    const variables = await store.load();
    expect(variables["My Group"]).toEqual({ a: "b" });
    expect(variables[group]["My Odd Rom Name"]).toBe("My Title");
    expect(Object.keys(variables[group]).length).toBeGreaterThan(1);
  });

  it("creates userVariables.json and works offline from the cache", async () => {
    const github = makeFakeGithub();
    await new CustomVariablesStore(makeLogger().service, github.fetch).load();
    expect(fs.existsSync(paths.userVariables)).toBe(true);
    github.setOffline(true);
    const store = new CustomVariablesStore(makeLogger().service, github.fetch);
    expect(Object.keys(await store.load()).length).toBeGreaterThan(0);
  });

  it('"if-missing" (the CLI): downloads only when there is no cache', async () => {
    const github = makeFakeGithub();
    const first = new CustomVariablesStore(makeLogger().service, github.fetch);
    expect(
      Object.keys(await first.load({ download: "if-missing" })).length,
    ).toBeGreaterThan(0);
    const downloads = github.requests.length;
    expect(downloads).toBeGreaterThan(0);

    const { service: logger, log } = makeLogger();
    const store = new CustomVariablesStore(logger, github.fetch);
    expect(
      Object.keys(await store.load({ download: "if-missing" })).length,
    ).toBeGreaterThan(0);
    expect(github.requests.length).toBe(downloads);
    expect(log.filter((l) => l.level === "error")).toHaveLength(0);
  });
});
