// Unit tests for the Heroic parser against fixture config trees (no real
// $HOME access). The fixtures mirror the installed.json shapes Heroic writes.
import { describe, expect, it } from "vitest";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { HeroicParser } from "../src/lib/parsers/heroic.parser";

function makeHeroicTree(): { dir: string; fortniteDir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "srm-heroic-"));
  const gamesDir = fs.mkdtempSync(path.join(os.tmpdir(), "srm-heroic-games-"));
  const shortHikeDir = path.join(gamesDir, "short-hike");
  fs.mkdirSync(shortHikeDir);
  fs.outputJsonSync(path.join(dir, "gog_store", "installed.json"), {
    installed: [
      {
        appName: "2044653500",
        install_path: shortHikeDir,
        executable: "",
        is_dlc: false,
        platform: "windows",
      },
    ],
  });
  fs.outputJsonSync(path.join(shortHikeDir, `goggame-2044653500.info`), {
    name: "A Short Hike",
  });
  const fortniteDir = path.join(gamesDir, "fortnite");
  fs.mkdirSync(fortniteDir);
  fs.outputJsonSync(
    path.join(dir, "legendaryConfig", "legendary", "installed.json"),
    {
      Fortnite: {
        app_name: "Fortnite",
        title: "Fortnite",
        install_path: fortniteDir,
        executable: "FortniteGame.exe",
        is_dlc: false,
      },
    },
  );
  fs.outputJsonSync(path.join(dir, "nile_store", "installed.json"), {
    installed: [
      {
        appName: "amzn1.adaptor.game.test",
        title: "Some Prime Game",
        install_path: path.join(gamesDir, "prime"),
        executable: "game.exe",
        is_dlc: true,
      },
    ],
  });
  return { dir, fortniteDir };
}

describe("HeroicParser", () => {
  it("launcher mode emits heroic:// launches per store with recorded titles", async () => {
    const { dir, fortniteDir } = makeHeroicTree();
    const res = await new HeroicParser().execute([], {
      heroicLauncherMode: true,
      heroicAppDataOverride: dir,
    });
    expect(res.success).toEqual([
      {
        extractedTitle: "A Short Hike",
        launchOptions:
          '--no-gui --no-sandbox "heroic://launch?appName=2044653500&runner=gog"',
      },
      {
        extractedTitle: "Fortnite",
        launchOptions:
          '--no-gui --no-sandbox "heroic://launch?appName=Fortnite&runner=legendary"',
      },
    ]);
    expect(res.failed).toEqual(["Skipping DLC: amzn1.adaptor.game.test"]);
  });

  it("executable mode launches from the recorded executable", async () => {
    const { dir, fortniteDir } = makeHeroicTree();
    const res = await new HeroicParser().execute([], {
      heroicAppDataOverride: dir,
    });
    expect(res.success).toEqual([
      {
        extractedTitle: "Fortnite",
        filePath: path.join(fortniteDir, "FortniteGame.exe"),
        startInDirectory: fortniteDir,
      },
    ]);
    expect(res.failed).toContain(
      'A Short Hike: no executable recorded. Enable "Launch via Heroic" to start it through the launcher.',
    );
  });

  it("rejects when the Heroic config directory does not exist", async () => {
    await expect(
      new HeroicParser().execute([], {
        heroicAppDataOverride: path.join(os.tmpdir(), "srm-heroic-missing"),
      }),
    ).rejects.toMatch(/Heroic config directory not found/);
  });
});
