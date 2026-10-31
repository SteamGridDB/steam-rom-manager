import { describe, expect, it } from "vitest";
import { ArtworkProviders } from "../../src/core/artwork-providers";
import { SgdbClient } from "../../src/core/sgdb-client";
import { Fetch } from "../../src/core/http";

// A fake SteamGridDB API + Steam CDN.
function fakeApi(opts: { failGrids?: number } = {}) {
  const requests: { url: string; method: string; auth?: string }[] = [];
  const ok = (data: any) => ({ success: true, data });
  const fetch: Fetch = async (url, init) => {
    requests.push({
      url,
      method: init?.method ?? "GET",
      auth: init?.headers?.Authorization,
    });
    const respond = (body: any, status = 200) => ({
      ok: status < 300,
      status,
      statusText: String(status),
      json: async () => body,
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    const u = new URL(url);
    if (u.hostname === "shared.steamstatic.com") {
      return respond(null, u.pathname.includes("missing") ? 404 : 200);
    }
    const p = decodeURIComponent(u.pathname.replace("/api/v2", ""));
    if (p.startsWith("/search/autocomplete/")) {
      const term = p.slice("/search/autocomplete/".length);
      return respond(ok(term === "Unknown Game" ? [] : [{ id: 42 }]));
    }
    if (p === "/grids/game/42") {
      if (opts.failGrids) return respond({ success: false }, opts.failGrids);
      return respond(
        ok([
          {
            id: 1,
            url: `https://cdn/grid-${u.searchParams.get("dimensions")}.png`,
            author: { name: "alice" },
          },
        ]),
      );
    }
    if (p === "/heroes/game/42") {
      return respond(
        ok([{ id: 2, url: "https://cdn/hero.png", author: { name: "bob" } }]),
      );
    }
    if (p === "/games/id/42") {
      return respond(
        ok({
          external_platform_data: {
            steam: [
              {
                id: 220,
                metadata: {
                  clienticon: "abc",
                  header_image_full: { english: "header.jpg" },
                  library_hero_full: { image: { english: "missing.jpg" } },
                },
              },
            ],
          },
        }),
      );
    }
    return respond({ success: false, errors: ["not found"] }, 404);
  };
  return { fetch, requests };
}

function lookup(
  providers: ArtworkProviders,
  title: string,
  imageType: string,
  provider: "sgdb" | "steamCDN",
  apis: object = {},
) {
  return new Promise<{ event: string; data: any }[]>((resolve) => {
    const events: { event: string; data: any }[] = [];
    providers.retrieveUrls(
      title,
      imageType,
      apis as any,
      provider,
      (event, data) => {
        events.push({ event, data });
        if (event === "completed") resolve(events);
      },
    );
  });
}

describe("ArtworkProviders", () => {
  it("SteamGridDB: searches, then queries the artwork type with the parser's options", async () => {
    const api = fakeApi();
    const events = await lookup(
      new ArtworkProviders(api.fetch),
      "Some Game",
      "long",
      "sgdb",
      { nsfw: true, imageMotionTypes: ["static"] },
    );
    expect(events.map((e) => e.event)).toEqual(["image", "completed"]);
    expect(events[0].data.content).toEqual({
      imageProvider: "SteamGridDB",
      imageUrl: "https://cdn/grid-460x215,920x430.png",
      imageGameId: "42",
      imageArtworkId: "1",
      imageUploader: "alice",
      loadStatus: "notStarted",
    });
    const gridRequest = api.requests.find((r) => r.url.includes("/grids/"));
    expect(new URL(gridRequest.url).searchParams.get("nsfw")).toBe("any");
    expect(new URL(gridRequest.url).searchParams.get("humor")).toBe("false");
    expect(gridRequest.auth).toMatch(/^Bearer /);
  });

  it("uses an explicit ${gameid:N} without searching", async () => {
    const api = fakeApi();
    await lookup(
      new ArtworkProviders(api.fetch),
      "${gameid:42}",
      "hero",
      "sgdb",
    );
    expect(api.requests.some((r) => r.url.includes("/search/"))).toBe(false);
  });

  it("reports no match once per title (on the long type) and completes", async () => {
    const api = fakeApi();
    const providers = new ArtworkProviders(api.fetch);
    const long = await lookup(providers, "Unknown Game", "long", "sgdb");
    const hero = await lookup(providers, "Unknown Game", "hero", "sgdb");
    expect(long.map((e) => e.event)).toEqual(["error", "completed"]);
    expect(long[0].data.error).toContain("no matching games");
    expect(hero.map((e) => e.event)).toEqual(["completed"]);
  });

  it("reports HTTP errors with status and url", async () => {
    const api = fakeApi({ failGrids: 500 });
    const events = await lookup(
      new ArtworkProviders(api.fetch),
      "Some Game",
      "tall",
      "sgdb",
    );
    expect(events[0]).toMatchObject({
      event: "error",
      data: { provider: "sgdb", title: "Some Game", error: 500 },
    });
    expect(events[0].data.url).toContain("/grids/game/42");
    expect(events.at(-1).event).toBe("completed");
  });

  it("Steam CDN: icon and header urls; missing artwork is reported", async () => {
    const api = fakeApi();
    const providers = new ArtworkProviders(api.fetch);
    const icon = await lookup(providers, "Some Game", "icon", "steamCDN");
    expect(icon[0].data.content.imageUrl).toBe(
      "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/220/abc.ico",
    );
    const long = await lookup(providers, "Some Game", "long", "steamCDN");
    expect(long[0].data.content.imageUrl).toBe(
      "https://shared.steamstatic.com/store_item_assets/steam/apps/220/header.jpg",
    );
    const hero = await lookup(providers, "Some Game", "hero", "steamCDN");
    expect(hero.map((e) => e.event)).toEqual(["error", "completed"]);
  });

  it("stopUrlDownload drops results of lookups already started", async () => {
    const api = fakeApi();
    const providers = new ArtworkProviders(api.fetch);
    const events: string[] = [];
    let stopped = 0;
    providers.stopEvent.subscribe(() => stopped++);
    providers.retrieveUrls("Some Game", "long", {} as any, "sgdb", (e) =>
      events.push(e),
    );
    providers.stopUrlDownload();
    await new Promise((r) => setTimeout(r, 50));
    expect(events).toEqual([]);
    expect(stopped).toBe(1);
    expect(
      (await lookup(providers, "Some Game", "long", "sgdb")).map(
        (e) => e.event,
      ),
    ).toEqual(["image", "completed"]);
  });
});

describe("SgdbClient", () => {
  it("unwraps data and turns API errors into exceptions", async () => {
    const api = fakeApi();
    const client = new SgdbClient(api.fetch);
    expect(await client.searchGame("Some Game")).toEqual([{ id: 42 }]);
    await expect(client.getLogos({ type: "game", id: 7 })).rejects.toThrow(
      "not found",
    );
  });
});
