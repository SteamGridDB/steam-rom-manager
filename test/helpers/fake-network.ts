// One fake fetch for everything the core talks to: GitHub (presets, custom
// variables), the SteamGridDB title list (fuzzy matcher) and the SteamGridDB
// API (artwork, whose image URLs point at `imageBase`).
import { Fetch } from "../../src/core/http";
import { makeFakeGithub } from "./fake-github";

export function makeFakeNetwork(
  imageBase: string = "http://127.0.0.1:9",
): Fetch {
  const github = makeFakeGithub();
  const json = (body: any, status = 200) => ({
    ok: status < 300,
    status,
    statusText: String(status),
    json: async () => body,
    text: async () => JSON.stringify(body),
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  return async (url, init) => {
    const u = new URL(url);
    if (
      u.hostname.endsWith("github.com") ||
      u.hostname.endsWith("githubusercontent.com")
    ) {
      return github.fetch(url, init);
    }
    if (u.hostname === "steamgriddb.com") {
      // fuzzy list
      const games = ["Super Mario World", "Chrono Trigger"];
      return json(
        u.search === "?total"
          ? { totalGames: String(games.length) }
          : { totalGames: games.length, games },
      );
    }
    if (u.hostname === "www.steamgriddb.com") {
      const p = decodeURIComponent(u.pathname.replace("/api/v2", ""));
      if (p.startsWith("/search/autocomplete/")) {
        const title = p.slice("/search/autocomplete/".length);
        const id = { "Super Mario World": 1001, "Chrono Trigger": 1002 }[title];
        return json({ success: true, data: id ? [{ id }] : [] });
      }
      const m = p.match(/^\/(grids|heroes|logos|icons)\/game\/(\d+)$/);
      if (m) {
        return json({
          success: true,
          data: [
            {
              id: Number(m[2]) * 10,
              url: `${imageBase}/${m[1]}/${m[2]}.png`,
              author: { name: "test" },
            },
          ],
        });
      }
    }
    return json({ success: false }, 404);
  };
}
