import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as paths from "../../src/paths";
import { FuzzyStore } from "../../src/core/fuzzy-store";
import { Fetch } from "../../src/core/http";
import { makeSettings } from "../helpers/fixtures";
import { makeLogger, makeSettingsService } from "../helpers/services-harness";

const games = ["Super Mario World", "Chrono Trigger"];

function fakeSgdb() {
  const requests: string[] = [];
  let offline = false;
  const fetch: Fetch = async (url) => {
    requests.push(url);
    if (offline) throw new TypeError("fetch failed");
    const body = url.endsWith("?total")
      ? { totalGames: String(games.length) }
      : { totalGames: games.length, games };
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => body,
      text: async () => JSON.stringify(body),
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  };
  return { fetch, requests, setOffline: (v: boolean) => (offline = v) };
}

describe("FuzzyStore", () => {
  beforeEach(() => {
    fs.rmSync(paths.fuzzyList, { force: true });
    fs.rmSync(paths.fuzzyCache, { force: true });
  });

  function makeStore(fetch: Fetch, settingsPartial: object = {}) {
    const settings = makeSettings(settingsPartial);
    const { store: settingsStore, calls } = makeSettingsService(settings);
    const store = new FuzzyStore(
      makeLogger().service,
      settingsStore as any,
      fetch,
    );
    return { store, settings, calls };
  }

  it("downloads the list when there is none, saves it and the timestamps", async () => {
    const sgdb = fakeSgdb();
    const { store, settings, calls } = makeStore(sgdb.fetch);
    await store.load();
    expect(sgdb.requests).toEqual(["https://steamgriddb.com/api/games/"]);
    expect(JSON.parse(fs.readFileSync(paths.fuzzyList, "utf8")).games).toEqual(
      games,
    );
    expect(settings.fuzzyMatcher.timestamps.download).toBeGreaterThan(0);
    expect(calls.saves).toBe(1);
    expect(store.fuzzyMatcher.isLoaded()).toBe(true);
  });

  it("uses the saved list when it's recent, without any request", async () => {
    const sgdb = fakeSgdb();
    await makeStore(sgdb.fetch).store.load();
    const now = Date.now();
    sgdb.requests.length = 0;
    const { store } = makeStore(sgdb.fetch, {
      fuzzyMatcher: { timestamps: { check: now, download: now } },
    });
    await store.load();
    expect(sgdb.requests).toEqual([]);
    expect(store.fuzzyMatcher.isLoaded()).toBe(true);
  });

  it("only checks the count when the list is merely stale", async () => {
    const sgdb = fakeSgdb();
    await makeStore(sgdb.fetch).store.load();
    sgdb.requests.length = 0;
    const now = Date.now();
    const { store } = makeStore(sgdb.fetch, {
      fuzzyMatcher: { timestamps: { check: 0, download: now } },
    });
    await store.load();
    expect(sgdb.requests).toEqual(["https://steamgriddb.com/api/games/?total"]);
  });

  it("offline mode never touches the network", async () => {
    const sgdb = fakeSgdb();
    const { store } = makeStore(sgdb.fetch, { offlineMode: true });
    await store.load();
    expect(sgdb.requests).toEqual([]);
  });

  it("a failed download is reported, not thrown", async () => {
    const sgdb = fakeSgdb();
    sgdb.setOffline(true);
    const settings = makeSettings();
    const { service: logger, log } = makeLogger();
    const store = new FuzzyStore(
      logger,
      makeSettingsService(settings).store as any,
      sgdb.fetch,
    );
    await store.load();
    expect(log.some((l) => l.level === "error")).toBe(true);
    expect(store.fuzzyMatcher.isLoaded()).toBe(false);
  });
});
