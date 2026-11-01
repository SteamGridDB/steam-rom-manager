import { afterAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { EADesktopParser } from "../../src/lib/parsers/ea-desktop.parser";
import { tempDir } from "../helpers/fixtures";

// EA Desktop writes installerdata.xml as UTF-8 or UTF-16LE (with BOM).
function installerData(title: string, contentId: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<DiPManifest version="4.0">
  <runtime>
    <launcher>
      <filePath>[HKEY_LOCAL_MACHINE\\SOFTWARE\\EA Games\\${title}\\Install Dir]${title}.exe</filePath>
      <parameters>-silent</parameters>
    </launcher>
  </runtime>
  <gameTitles>
    <gameTitle locale="en_US">${title}</gameTitle>
  </gameTitles>
  <contentIDs>
    <contentID>${contentId}</contentID>
  </contentIDs>
</DiPManifest>`;
}

describe.runIf(os.type() === "Windows_NT")("EA Desktop parser", () => {
  const root = tempDir("ea");
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (game: string, content: Buffer) => {
    const dir = path.join(root, game, "__Installer");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "installerdata.xml"), content);
  };

  it("reads UTF-8 and UTF-16LE installer data (was: failed on a Blob in the main process)", async () => {
    write("Game One", Buffer.from(installerData("Game One", "111"), "utf8"));
    write(
      "Game Two",
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(installerData("Game Two", "222"), "utf16le"),
      ]),
    );
    const result = await new EADesktopParser().execute([], {
      eaGamesDir: root,
    });
    expect(result.failed).toEqual([]);
    expect(
      result.success
        .map((s) => [s.extractedTitle, s.extractedAppId, s.fileLaunchOptions])
        .sort(),
    ).toEqual([
      ["Game One", "111", "-silent"],
      ["Game Two", "222", "-silent"],
    ]);
  });
});
