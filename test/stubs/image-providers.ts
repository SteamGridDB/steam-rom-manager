// Stand-ins for the image-provider worker modules. The real ones register
// DOM Worker listeners (`self`) at import time and talk to SteamGridDB over
// the network; tests must do neither. Calls are recorded so tests can assert
// on (and pin) how often lib code queries SteamGridDB.
export const sgdbCalls: { method: string; title: string }[] = [];
export const sgdbIds: { [title: string]: number[] } = {};

export class SteamGridDbProvider {
  static async retrieveIdsFromTitle(title: string): Promise<number[]> {
    sgdbCalls.push({ method: "retrieveIdsFromTitle", title });
    return sgdbIds[title] ?? [];
  }

  static async retrievePossibleIds(title: string): Promise<any[]> {
    sgdbCalls.push({ method: "retrievePossibleIds", title });
    return (sgdbIds[title] ?? []).map((id) => ({ id, posterUrl: "" }));
  }
}

export class SteamCDNProvider {}

export const imageProviders = {};
