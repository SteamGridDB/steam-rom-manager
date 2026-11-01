import { Fetch, getDefaultFetch } from "../../../core/http";

// A Steam account's owned games via the Steam Web API.
//
// Must not go through Node's TLS stack (node-fetch fails with "unable to get
// local issuer certificate" on some systems), so in the main process it uses
// the default fetch, which is Electron's net.fetch in the main process.
export async function fetchOwnedGames(
  apiKey: string,
  steamId: string,
  fetch: Fetch = getDefaultFetch(),
): Promise<any> {
  const requestUrl =
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
    `?key=${encodeURIComponent(apiKey)}` +
    `&steamid=${encodeURIComponent(steamId)}` +
    `&include_appinfo=1&include_played_free_games=1&format=json`;
  const res = await fetch(requestUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}
