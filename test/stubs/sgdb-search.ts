// Stand-in for src/lib/image-providers/sgdb-search.ts, which queries
// SteamGridDB over the network. Calls are recorded so tests can assert on
// (and pin) how often lib code searches SteamGridDB.
export const sgdbCalls: { method: string; title: string }[] = [];
export const sgdbIds: { [title: string]: number[] } = {};
// Titles whose lookups reject, simulating SteamGridDB being unreachable.
export const sgdbFailures = new Set<string>();

export async function retrieveIdsFromTitle(title: string): Promise<number[]> {
  sgdbCalls.push({ method: "retrieveIdsFromTitle", title });
  if (sgdbFailures.has(title)) {
    throw new Error("getaddrinfo ENOTFOUND www.steamgriddb.com");
  }
  return sgdbIds[title] ?? [];
}

export async function retrievePossibleIds(title: string): Promise<any[]> {
  sgdbCalls.push({ method: "retrievePossibleIds", title });
  return (sgdbIds[title] ?? []).map((id) => ({ id, posterUrl: "" }));
}
