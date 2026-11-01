// A refresh keeps the artwork the previous list already had.
import { describe, expect, it } from "vitest";
import {
  emptyPools,
  keepArtworkPicks,
  keepRetrievedPools,
} from "../../src/core/image-pools";

const pool = (queries: string[], content: string[] = [], retrieved = false) => ({
  retrieving: false,
  retrieved,
  parserEnabledProviders: ["sgdb"] as any,
  online: {
    sgdb: {
      searchQueries: queries,
      imageProviderAPIs: {} as any,
      content: content.map((imageUrl) => ({ imageUrl }) as any),
    },
    steamCDN: { searchQueries: queries, imageProviderAPIs: {} as any, content: [] as any[] },
  },
  offline: { local: [], manual: [], imported: [] } as any,
});

describe("keepRetrievedPools", () => {
  it("keeps finished pools searched the same way; the rest still need looking up", () => {
    const previous = emptyPools();
    previous.tall["Kept"] = pool(["Kept"], ["a.png"], true);
    previous.tall["Unfinished"] = pool(["Unfinished"], ["b.png"], false);
    previous.tall["Requeried"] = pool(["Old query"], ["c.png"], true);
    previous.tall["Kept"].offline.manual = [{ imageUrl: "mine.png" } as any];
    const pools = emptyPools();
    for (const key of ["Kept", "Unfinished", "Requeried", "New"]) {
      pools.tall[key] = pool([key === "Requeried" ? "New query" : key]);
    }
    const toLookUp = keepRetrievedPools(previous, pools);
    expect(toLookUp.tall.sort()).toEqual(["New", "Requeried", "Unfinished"]);
    expect(pools.tall["Kept"].online.sgdb.content).toEqual([{ imageUrl: "a.png" }]);
    expect(pools.tall["Kept"].offline.manual).toEqual([{ imageUrl: "mine.png" }]);
    expect(pools.tall["Unfinished"].online.sgdb.content).toEqual([]);
    expect(toLookUp.hero).toEqual([]);
  });

  it("no previous list: everything is looked up", () => {
    const pools = emptyPools();
    pools.logo["A"] = pool(["A"]);
    expect(keepRetrievedPools(undefined, pools).logo).toEqual(["A"]);
  });
});

describe("keepArtworkPicks", () => {
  it("keeps a game's picked artwork when it's still in the list with the same pool", () => {
    const app = (pool: string, imageIndex: number) => ({
      images: { tall: { imagePool: pool, imageIndex } },
    });
    const previous: any = { steam: { "1": { apps: { a: app("A", 3), b: app("B", 2) } } } };
    const next: any = { steam: { "1": { apps: { a: app("A", 0), b: app("B2", 0), c: app("C", 0) } } } };
    keepArtworkPicks(previous, next);
    expect(next.steam["1"].apps.a.images.tall.imageIndex).toBe(3);
    expect(next.steam["1"].apps.b.images.tall.imageIndex).toBe(0);
    expect(next.steam["1"].apps.c.images.tall.imageIndex).toBe(0);
  });
});
