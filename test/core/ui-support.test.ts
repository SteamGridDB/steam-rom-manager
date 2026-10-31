import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as paths from "../../src/paths";
import { UiSupport } from "../../src/core/ui-support";
import { ShellScripts } from "../../src/core/shell-scripts";
import { submitBugReport } from "../../src/core/bug-report";
import { LibraryReader } from "../../src/core/library-reader";
import { Fetch } from "../../src/core/http";
import { generateShortAppId } from "../../src/lib/helpers/steam/generate-app-id";
import { makeFakeSteam, tempDir } from "../helpers/fixtures";
import { makeLogger } from "../helpers/services-harness";
import { makeFakeGithub } from "../helpers/fake-github";

const noFetch: Fetch = async () => {
  throw new Error("no network in this test");
};

// Things the sandboxed UI asks the main process to do for it.
describe("UiSupport", () => {
  it("lists Steam logins with their cached avatar as a file URL", async () => {
    const steam = makeFakeSteam(tempDir("logins"), [
      { accountID: "11111111", name: "alice" },
      { accountID: "22222222", name: "bob" },
    ]);
    const support = new UiSupport(noFetch);
    const before = await support.steamLogins(steam);
    expect(before.map((l) => [l.name, l.avatar])).toEqual([
      ["alice", null],
      ["bob", null],
    ]);
    const avatarDir = path.join(steam, "config", "avatarcache");
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.writeFileSync(path.join(avatarDir, `${before[0].steamID64}.png`), "");
    const after = await support.steamLogins(steam);
    expect(after[0].avatar).toMatch(/^file:\/\/\/.*avatarcache\/\d+\.png$/);
    expect(after[1].avatar).toBeNull();
  });

  it("themes: copies of the app's, the user's listed; saved and deleted only in themes/user", async () => {
    fs.rmSync(paths.themesDir, { recursive: true, force: true });
    const support = new UiSupport(noFetch);
    expect(await support.userThemes()).toEqual([]);
    expect(fs.readdirSync(paths.defaultThemesDir)).toContain("deck.json");

    const theme = { name: "Mint", tokens: { accent: "#3ddc97" } };
    expect(await support.saveUserTheme("mint.json", theme)).toBe("mint.json");
    expect(await support.userThemes()).toEqual([
      { file: "mint.json", data: theme },
    ]);
    for (const bad of [
      "../escape.json",
      "sub/x.json",
      "x.txt",
      ".json",
      "C:x.json",
    ]) {
      await expect(support.saveUserTheme(bad, theme)).rejects.toThrow(
        /Not a theme file name/,
      );
      await expect(support.deleteUserTheme(bad)).rejects.toThrow(
        /Not a theme file name/,
      );
    }
    expect(fs.existsSync(path.join(paths.themesDir, "escape.json"))).toBe(
      false,
    );
    await support.deleteUserTheme("mint.json");
    expect(await support.userThemes()).toEqual([]);
  });

  it("has no logins for a missing Steam directory", async () => {
    const support = new UiSupport(noFetch);
    expect(await support.steamLogins("")).toEqual([]);
    expect(await support.steamLogins(path.join(tempDir("x"), "nope"))).toEqual(
      [],
    );
  });

  it("deletes artwork backups (and copes when there are none)", async () => {
    const backups = path.join(paths.userDataDir, "artworkBackups");
    fs.mkdirSync(path.join(backups, "1234"), { recursive: true });
    fs.writeFileSync(path.join(backups, "1234", "a.png"), "x");
    const support = new UiSupport(noFetch);
    await support.clearArtworkBackups();
    expect(fs.existsSync(backups)).toBe(false);
    await support.clearArtworkBackups();
  });

  it("turns a browsed path into a field value", () => {
    const support = new UiSupport(noFetch);
    const dir = path.join(tempDir("browse"), "SNES [USA]");
    const slashed = dir.replaceAll("\\", "/");
    const escapedDir = slashed.replace(/[[\]]/g, (c) => `\\${c}`);
    expect(support.browsedValue(dir, null, {})).toBe(dir);
    expect(support.browsedValue(dir, null, { useForwardSlash: true })).toBe(
      escapedDir,
    );
    // appendGlob is added; a field that already has a pattern keeps its last
    // segment instead.
    expect(
      support.browsedValue(dir, null, { appendGlob: "${title}.@(sfc|smc)" }),
    ).toBe(`${escapedDir}/\${title}.@(sfc|smc)`);
    expect(
      support.browsedValue(dir, "/old/place/${title}.sfc", {
        appendGlob: "${title}.@(sfc|smc)",
      }),
    ).toBe(`${escapedDir}/\${title}.sfc`);
  });
});

describe("ShellScripts", () => {
  const scriptsDir = () => path.join(paths.userDataDir, "scripts");

  it("downloads files/shellscripts into userData/scripts", async () => {
    fs.rmSync(scriptsDir(), { recursive: true, force: true });
    const logger = makeLogger();
    const github = makeFakeGithub();
    const scripts = new ShellScripts(logger.service as any, github.fetch);
    const states: boolean[] = [];
    scripts.onDownloadingChange((d) => states.push(d));
    await scripts.download();
    expect(fs.readFileSync(path.join(scriptsDir(), "bnet.ps1"), "utf8")).toBe(
      fs.readFileSync(
        path.join(__dirname, "../../files/shellscripts/bnet.ps1"),
        "utf8",
      ),
    );
    expect(states).toEqual([true, false]);
    expect(logger.log.map((l) => l.message)).toEqual([
      "Shell scripts have been updated.",
    ]);
  });

  it("reports a failed download and is not left 'downloading'", async () => {
    const logger = makeLogger();
    const github = makeFakeGithub();
    github.setOffline(true);
    const scripts = new ShellScripts(logger.service as any, github.fetch);
    await scripts.download();
    expect(scripts.getDownloading()).toBe(false);
    expect(logger.log).toEqual([
      expect.objectContaining({
        level: "error",
        message: expect.stringMatching(/^Could not update shell scripts/),
      }),
    ]);
  });
});

describe("submitBugReport", () => {
  const server = (response: any, status = 200) => {
    const sent: { url: string; body: FormData }[] = [];
    const fetch: Fetch = async (url, init) => {
      sent.push({ url, body: init.body });
      return {
        ok: status === 200,
        status,
        statusText: "x",
        json: async () => response,
        text: async () => "",
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    };
    return { fetch, sent };
  };

  it("uploads the description, log, SRM data and (optionally) VDFs", async () => {
    fs.writeFileSync(paths.userSettings, "{}");
    const steam = makeFakeSteam(
      tempDir("report"),
      [{ accountID: "11111111", name: "alice" }],
      { userContent: true },
    );
    const { fetch, sent } = server({ key: "k1", delete_key: "d1" });
    const result = await submitBugReport(fetch, {
      description: "it broke",
      discordUser: "me",
      logText: "[error] boom",
      vdfsFrom: steam,
    });
    expect(result).toEqual({ ok: true, key: "k1", deleteKey: "d1" });
    expect(sent[0].url).toBe("https://logs.jozen.blue/logs");
    const body = sent[0].body;
    expect(await (body.get("description") as Blob).text()).toBe(
      "Description: it broke\n\n Discord User: me",
    );
    expect(await (body.get("logMessages") as Blob).text()).toBe("[error] boom");
    expect(body.getAll("files[]").map((f: any) => f.name)).toEqual(
      expect.arrayContaining(["userSettings.json", "shortcuts_11111111.vdf"]),
    );
  });

  it("needs a real Steam directory to attach VDFs", async () => {
    const { fetch, sent } = server({});
    const result = await submitBugReport(fetch, {
      description: "x",
      logText: "",
      vdfsFrom: "",
    });
    expect(result).toEqual(
      expect.objectContaining({ ok: false, invalid: true }),
    );
    expect(sent).toEqual([]);
  });

  it("reports server problems", async () => {
    expect(
      await submitBugReport(server({}).fetch, {
        description: "x",
        logText: "",
      }),
    ).toEqual({ ok: false, error: "Bug report server returned no data." });
    expect(
      (
        await submitBugReport(server({}, 500).fetch, {
          description: "x",
          logText: "",
        })
      ).error,
    ).toMatch(/^Bug report server error: HTTP 500/);
  });
});

describe("LibraryReader", () => {
  it("reads shortcuts, then each one's artwork and controller settings", async () => {
    const steam = makeFakeSteam(
      tempDir("library"),
      [{ accountID: "11111111", name: "alice" }],
      { userContent: true },
    );
    const reader = new LibraryReader(
      makeLogger().service as any,
      {
        getKnownSteamDirectories: () => [steam],
      } as any,
    );
    const shortcuts = await reader.read();
    const user = shortcuts[steam]["11111111"];
    expect(user.map((s) => s.appname)).toEqual(["My Manual Shortcut"]);

    const shortcut = user[0];
    const grid = path.join(steam, "userdata", "11111111", "config", "grid");
    fs.mkdirSync(grid, { recursive: true });
    const short = generateShortAppId(shortcut.exe, shortcut.appname);
    fs.writeFileSync(path.join(grid, `${short}_hero.png`), "");
    const details = await reader.details(steam, "11111111", shortcut.appid);
    expect(details.artwork.hero).toMatch(/^file:\/\/\/.*_hero\.png$/);
    expect(details.artwork.tall).toBeNull();
    expect(details.controllers).toEqual({});
    expect(details.steamInputEnabled).toBe("1");

    await expect(reader.details(steam, "11111111", 12345)).rejects.toThrow(
      /Unknown shortcut/,
    );
  });
});
