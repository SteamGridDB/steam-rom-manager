import { describe, expect, it } from "vitest";
import { parsers } from "../../src/lib/parsers";
import type { SteamParser } from "../../src/lib/parsers/steam.parser";

describe("Steam parser: source mods' gameinfo.txt", () => {
  it("keeps titles with spaces and commas, and URLs, whole", () => {
    const steam = parsers.Steam as unknown as SteamParser;
    const info = steam.gameInfoParser(
      [
        '"GameInfo"',
        "{",
        '  game "Black Mesa, Definitive"   // the title',
        "  type singleplayer_only",
        '  developer_url "http://www.crowbarcollective.com"',
        "  FileSystem",
        "  {",
        "    SteamAppId 362890",
        "  }",
        "}",
      ].join("\n"),
    );
    expect(info.game).toBe("Black Mesa, Definitive");
    expect(info.type).toBe("singleplayer_only");
    expect(info.developer_url).toBe("http://www.crowbarcollective.com");
    expect(info.FileSystem.SteamAppId).toBe("362890");
  });
});
