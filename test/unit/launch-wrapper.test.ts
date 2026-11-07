import { describe, expect, it } from "vitest";
import {
  gameCommand,
  makeLaunchWrapper,
  shellQuote,
  splitCommand,
  wrapperArguments,
  wrapperFileContent,
} from "../../src/lib/launch-wrapper";
import { ScriptWrapperConfig } from "../../src/models";

const user = (over: Partial<ScriptWrapperConfig> = {}): ScriptWrapperConfig => ({
  enabled: true,
  preLaunch: { script: "/u/pre.sh", delay: 2 },
  postLaunch: { script: "/u/post.sh", delay: 0 },
  postExit: { script: "", delay: 5 },
  ...over,
});

describe("launch wrapper", () => {
  it("isn't made unless the user turns it on or the parser has one", () => {
    expect(makeLaunchWrapper('"/emu"', undefined, undefined)).toBeUndefined();
    expect(
      makeLaunchWrapper('"/emu"', user({ enabled: false }), undefined),
    ).toBeUndefined();
    // on, with no scripts: still wrapped (Steam tracks the game)
    expect(
      makeLaunchWrapper(
        '"/emu"',
        user({
          preLaunch: { script: "", delay: 3 },
          postLaunch: { script: " ", delay: 0 },
        }),
        undefined,
      ),
    ).toEqual({
      target: '"/emu"',
      preLaunch: [],
      postLaunch: [],
      postExit: [],
    });
  });

  it("parser scripts run inside the user's", () => {
    const wrapper = makeLaunchWrapper(
      '"/emu"',
      user({ postExit: { script: "/u/exit.sh", delay: 5 } }),
      {
        preLaunch: [{ script: "/p/pre" }],
        postLaunch: [{ script: "/p/post" }],
        postExit: [{ script: "/p/exit" }],
        game: { folder: "/games/x" },
      },
    );
    expect(wrapper.preLaunch.map((s) => s.script)).toEqual([
      "/u/pre.sh",
      "/p/pre",
    ]);
    expect(wrapper.postLaunch.map((s) => s.script)).toEqual([
      "/p/post",
      "/u/post.sh",
    ]);
    expect(wrapper.postExit.map((s) => s.script)).toEqual([
      "/p/exit",
      "/u/exit.sh",
    ]);
    expect(wrapper.preLaunch[0].delay).toBe(2);
    expect(wrapper.game).toEqual({ folder: "/games/x" });
  });

  it("the game's command: launch options after the executable, or in place of %command%", () => {
    expect(gameCommand('"/emu/x"', '"rom.sfc"')).toBe('"/emu/x" "rom.sfc"');
    expect(gameCommand('"/emu/x"', "")).toBe('"/emu/x"');
    expect(gameCommand('"/emu/x"', "gamemoderun %command% -f")).toBe(
      'gamemoderun "/emu/x" -f',
    );
    expect(splitCommand('"C:\\Games\\a b.exe" -x "y z"')).toEqual({
      file: "C:\\Games\\a b.exe",
      arguments: '-x "y z"',
    });
    expect(splitCommand("C:\\x.exe")).toEqual({
      file: "C:\\x.exe",
      arguments: "",
    });
  });

  it("Windows: the shortcut runs the game's file through a hidden console; the file has the settings", () => {
    expect(wrapperArguments("C:\\srm\\1.ps1", "Windows")).toBe(
      '--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\\srm\\1.ps1"',
    );
    const text = wrapperFileContent(
      {
        title: "Café's Game",
        wrapper: makeLaunchWrapper(
          '"C:\\Emu\\emu.exe"',
          user({ preLaunch: { script: "C:\\u\\pre.ps1", delay: 2 } }),
          undefined,
        ),
        launchOptions: '"C:\\Roms\\x.iso"',
        startInDirectory: '"C:\\Emu"',
      },
      "Windows",
    );
    const json = text.slice(
      text.indexOf("@'") + 2,
      text.indexOf("'@ | ConvertFrom-Json"),
    );
    expect(JSON.parse(json)).toMatchObject({
      title: "Café's Game",
      file: "C:\\Emu\\emu.exe",
      arguments: '"C:\\Roms\\x.iso"',
      workingDirectory: "C:\\Emu",
      game: null,
      preLaunch: [{ script: "C:\\u\\pre.ps1", delay: 2 }],
    });
    expect(text).toContain(
      "& (Join-Path (Split-Path $PSScriptRoot -Parent) 'srm-launch.ps1') -Config $config",
    );
  });

  it("Windows: a parser's launch (e.g. a launcher URL) replaces the game's command", () => {
    const text = wrapperFileContent(
      {
        title: "X",
        wrapper: makeLaunchWrapper('"C:\\ps.exe"', undefined, {
          launch: { file: "com.epicgames.launcher://apps/X?action=launch" },
          game: { folder: "C:\\Games\\X", exeName: "X.exe" },
        }),
        launchOptions: "-ignored",
        startInDirectory: "",
      },
      "Windows",
    );
    expect(text).toContain(
      '"file": "com.epicgames.launcher://apps/X?action=launch"',
    );
    expect(text).toContain('"folder": "C:\\\\Games\\\\X"');
  });

  it("Linux/macOS: the file sets shell variables (quoted) and sources the launch script", () => {
    expect(wrapperArguments("/srm/it's/1.sh", "Unix")).toBe(
      `'/srm/it'\\''s/1.sh'`,
    );
    const text = wrapperFileContent(
      {
        title: "Bob's Game",
        wrapper: makeLaunchWrapper('"/emu/x"', user(), {
          preLaunch: [{ script: "/p/pre", args: ["-a", "b c"] }],
        }),
        launchOptions: '"/roms/$x.sfc"',
        startInDirectory: '"/emu"',
      },
      "Unix",
    );
    expect(text.split("\n")).toEqual(
      expect.arrayContaining([
        "#!/bin/sh",
        `SRM_TITLE=${shellQuote("Bob's Game")}`,
        `SRM_COMMAND=${shellQuote('"/emu/x" "/roms/$x.sfc"')}`,
        `SRM_START_DIR='/emu'`,
        "SRM_PRELAUNCH_COUNT=2",
        "SRM_PRELAUNCH_1_SCRIPT='/u/pre.sh'",
        "SRM_PRELAUNCH_1_DELAY=2",
        "SRM_PRELAUNCH_2_SCRIPT='/p/pre'",
        `SRM_PRELAUNCH_2_ARGS=${shellQuote(`'-a' 'b c'`)}`,
        "SRM_POSTLAUNCH_COUNT=1",
        "SRM_POSTEXIT_COUNT=0",
        '. "$(dirname "$0")/../srm-launch.sh"',
      ]),
    );
  });
});
