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

  it("a shortcut's logo gets Steam's default logo position, unless it has one; a Steam game's doesn't", async () => {
    const root = tempDir("grid-logo");
    const grid = path.join(root, "grid");
    fs.mkdirSync(grid);
    fs.writeFileSync(path.join(grid, "222.json"), "mine");
    const source = path.join(root, "logo.png");
    fs.writeFileSync(source, "logo");
    const file = new VDF_ScreenshotsFile(
      path.join(root, "screenshots.vdf"),
      grid,
    );
    await file.read();
    const logo = (appId: string, logoPosition: boolean) =>
      file.addItem({
        appId,
        title: "Game",
        url: encodeFile(source),
        artworkType: "logo",
        logoPosition,
      });
    logo("111_logo", true); // a shortcut
    logo("222_logo", true); // a shortcut whose position the user set
    logo("570_logo", false); // a Steam game
    file.addLogoPosition("333"); // a shortcut keeping the logo it has
    expect((await file.write(false)).error).toBeUndefined();

    expect(fs.readdirSync(grid).sort()).toEqual([
      "111.json",
      "111_logo.png",
      "222.json",
      "222_logo.png",
      "333.json",
      "570_logo.png",
    ]);
    expect(
      JSON.parse(fs.readFileSync(path.join(grid, "111.json"), "utf8")),
    ).toEqual({
      nVersion: 1,
      logoPosition: {
        pinnedPosition: "BottomLeft",
        nWidthPct: 50,
        nHeightPct: 50,
        nVersion: 1,
      },
    });
    expect(fs.readFileSync(path.join(grid, "222.json"), "utf8")).toBe("mine");
  });

  it("removing a Steam game's artwork keeps its .json (the user's); a shortcut's goes", async () => {
    const root = tempDir("grid-remove");
    const grid = path.join(root, "grid");
    fs.mkdirSync(grid);
    for (const name of [
      "570.png",
      "570.json",
      "570_logo.png",
      "3000000000.png",
      "3000000000.json",
      "3000000000_logo.png",
    ]) {
      fs.writeFileSync(path.join(grid, name), "old");
    }
    const file = new VDF_ScreenshotsFile(
      path.join(root, "screenshots.vdf"),
      grid,
    );
    await file.read();
    file.extraneous = [lengthenAppId("570"), lengthenAppId("3000000000")];
    file.steamGames = [lengthenAppId("570")];
    expect((await file.write(false)).error).toBeUndefined();
    expect(fs.readdirSync(grid)).toEqual(["570.json"]);
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
