// SteamGridDB game lookups used outside the artwork providers (file parser,
// "fix match" in the preview).
import { sgdbIdRegex } from "./available-providers";
import { SgdbClient } from "../../core/sgdb-client";
import { getDefaultFetch } from "../../core/http";

export async function retrieveIdsFromTitle(title: string): Promise<number[]> {
  if (sgdbIdRegex.test(title)) {
    return [parseInt(title.match(sgdbIdRegex)[1])];
  }
  const client = new SgdbClient(getDefaultFetch());
  // URL encode plus signs to fix search issues with titles ending in "+"
  const encodedTitle = title.replace(/\+/g, "%2B");
  const games = await client.searchGame(encodedTitle);
  return games.map((game: any) => game.id);
}

export async function retrievePossibleIds(title: string) {
  const client = new SgdbClient(getDefaultFetch());
  // URL encode plus signs to fix search issues with titles ending in "+"
  const encodedTitle = title.replace(/\+/g, "%2B");
  const games = await client.searchGame(encodedTitle);
  for (const game of games) {
    const grids = (
      await client.getGrids({
        id: game.id,
        type: "game",
        dimensions: ["600x900"],
      })
    ).filter((grid: any) => !grid.url.endsWith("?")); // Nintendo Sucks
    game.posterUrl = grids.length ? grids[0].url : "";
  }
  return games;
}
