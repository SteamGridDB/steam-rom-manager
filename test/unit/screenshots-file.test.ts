import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { VDF_ScreenshotsFile } from "../../src/lib/vdf-screenshots-file";
import { encodeFile } from "../../src/lib/helpers/url/file-url";
import { lengthenAppId } from "../../src/lib/helpers/steam";
import { tempDir } from "../helpers/fixtures";

describe("grid folder on save", () => {
  it("replaces other extensions of written artwork (keeping Steam's .json) and removes extraneous ids' files", async () => {
    const root = tempDir("grid");
    const grid = path.join(root, "grid");
    fs.mkdirSync(grid);
    for (const name of [
      "123p.jpg", // same artwork, old extension: goes
      "123p.json", // Steam's settings for it: stays
      "1234p.png", // another app (shares a prefix): stays
      "456p.png", // extraneous app: all of its files go
      "456_hero.jpg",
      "456.json",
      "789.png", // untouched app
    ]) {
      fs.writeFileSync(path.join(grid, name), "old");
    }
    const source = path.join(root, "new.png");
    fs.writeFileSync(source, "new");

    const file = new VDF_ScreenshotsFile(
      path.join(root, "screenshots.vdf"),
      grid,
    );
    await file.read();
    file.addItem({
      appId: "123p",
      title: "Game",
      url: encodeFile(source),
      artworkType: "tall",
    } as any);
    file.extraneous = [lengthenAppId("456")];
    const { error } = await file.write(false);

    expect(error).toBeUndefined();
    expect(fs.readdirSync(grid).sort()).toEqual([
      "1234p.png",
      "123p.json",
      "123p.png",
      "789.png",
    ]);
    expect(fs.readFileSync(path.join(grid, "123p.png"), "utf8")).toBe("new");
  });

  it("a grid folder that doesn't exist yet", async () => {
    const root = tempDir("grid-new");
    const source = path.join(root, "new.png");
    fs.writeFileSync(source, "new");
    const file = new VDF_ScreenshotsFile(
      path.join(root, "screenshots.vdf"),
      path.join(root, "grid"),
    );
    await file.read();
    file.addItem({
      appId: "123p",
      title: "Game",
      url: encodeFile(source),
      artworkType: "tall",
    } as any);
    expect((await file.write(false)).error).toBeUndefined();
    expect(fs.readdirSync(path.join(root, "grid"))).toEqual(["123p.png"]);
  });
});
