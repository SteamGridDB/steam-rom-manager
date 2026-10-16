import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/main/cli-args";

const parse = (...args: string[]) => {
  let printed = "";
  let error: Error | undefined;
  let request;
  try {
    request = parseCliArgs(args, {
      exitProcess: false,
      print: (text) => (printed += text),
    });
  } catch (e) {
    error = e as Error;
  }
  return { request, printed, error };
};

describe("parseCliArgs", () => {
  it("no command: the app opens its window (Chromium flags are ignored)", () => {
    expect(parse().request).toBeUndefined();
    expect(parse("--remote-debugging-port=9333").request).toBeUndefined();
  });

  it("parses each command", () => {
    expect(parse("list").request).toMatchObject({ command: "list" });
    expect(parse("nuke").request).toMatchObject({ command: "nuke" });
    expect(parse("add").request).toEqual({
      command: "add",
      parsers: [],
      all: false,
      only: false,
    });
    expect(parse("disable", "--all").request).toMatchObject({
      command: "disable",
      all: true,
    });
    expect(
      parse("enable", "Snes9x (SNES)", "Dolphin (GameCube)").request,
    ).toMatchObject({
      command: "enable",
      parsers: ["Snes9x (SNES)", "Dolphin (GameCube)"],
    });
    // older scripts' --names still works (ids and names both do now)
    expect(parse("disable", "--names", "Snes9x (SNES)").request).toMatchObject({
      command: "disable",
      parsers: ["Snes9x (SNES)"],
    });
  });

  it("add/remove --only, by id or name; long ids stay exact strings", () => {
    expect(
      parse("add", "--only", "167883018714467028", "16801455676611057").request,
    ).toMatchObject({
      command: "add",
      only: true,
      parsers: ["167883018714467028", "16801455676611057"],
    });
    expect(parse("remove", "--only", "Snes9x (SNES)").request).toMatchObject({
      command: "remove",
      only: true,
      parsers: ["Snes9x (SNES)"],
    });
  });

  it("rejects ambiguous input instead of guessing", () => {
    expect(parse("add", "--only").error?.message).toMatch(
      /--only needs at least one parser/,
    );
    // parsers without --only would silently run every enabled parser
    expect(parse("add", "123").error?.message).toMatch(/use --only/);
    expect(parse("enable").error?.message).toMatch(/or use --all/);
  });

  it("help text: commands and options, no color codes or broken words", () => {
    const { printed } = parse("--help");
    for (const text of [
      "srm list",
      "srm add [parsers..]",
      "srm remove [parsers..]",
      "srm nuke",
      "Close Steam completely",
    ]) {
      expect(printed).toContain(text);
    }
    expect(printed).not.toMatch(/\x1b\[/);
    // the old help split words across lines ("Us\nage")
    expect(printed).not.toMatch(/\n\s+(age|sage|ge):/);
    const addHelp = parse("add", "--help").printed;
    expect(addHelp).toContain("--only");
    expect(addHelp).not.toContain("--names");
  });

  it("create/edit: parser settings as options (lists, switches, any spelling of names)", () => {
    expect(
      parse(
        "create",
        "--type",
        "glob",
        "--name",
        "My Fancy Parser",
        "--steam-categories",
        "Puzzle",
        "Fun",
        "--no-drm-protect",
      ).request,
    ).toMatchObject({
      command: "create-parser",
      fields: {
        type: "glob",
        name: "My Fancy Parser",
        "steam-categories": ["Puzzle", "Fun"],
        "drm-protect": false,
      },
    });
    const edit = parse("edit-parser", "1234", "--rom-directory", "D:/roms");
    expect(edit.request).toMatchObject({
      command: "edit-parser",
      parser: "1234",
      fields: { "rom-directory": "D:/roms" },
    });
    // only what was given
    expect(Object.keys(edit.request.fields)).toEqual(["rom-directory"]);
    expect(parse("delete", "a", "My Parser").request).toMatchObject({
      command: "delete-parser",
      parsers: ["a", "My Parser"],
    });
    expect(parse("view", "a", "--type", "--name").request).toMatchObject({
      command: "view-parser",
      parser: "a",
      show: ["type", "name"],
    });
    // everything when nothing is named; "show" is another name for it
    expect(parse("show", "a").request).toMatchObject({
      command: "view-parser",
      parser: "a",
      show: [],
    });
    expect(parse("view", "a", "--romdir").error?.message).toBe(
      "Unknown option --romdir (did you mean --rom-directory?)",
    );
  });

  it("--parser-type is --type (the app reruns --type commands with it: Chromium reserves --type)", () => {
    for (const args of [
      ["create", "--parser-type", "glob", "--name", "x"],
      ["create", "--parser-type=glob", "--name", "x"],
    ]) {
      expect(parse(...args).request.fields).toEqual({
        type: "glob",
        name: "x",
      });
    }
    expect(parse("view", "a", "--parser-type").request.show).toEqual(["type"]);
    expect(
      parse("create", "--parser-type", "Steam", "--help").printed,
    ).not.toContain("--rom-directory");
  });

  it("create/edit: unknown options are refused, with a suggestion", () => {
    expect(
      parse("create", "--type", "glob", "--rom-dir", "x").error?.message,
    ).toBe("Unknown option --rom-dir (did you mean --rom-directory?)");
    expect(parse("edit", "a", "--zzz", "x").error?.message).toBe(
      "Unknown option --zzz",
    );
  });

  it("create help: every setting; with --type, that type's, required first", () => {
    const all = parse("create", "--help").printed;
    for (const flag of [
      "--type",
      "--rom-directory",
      "--glob",
      "--parse-strategy",
      "--sgdb-styles",
      "--default-image-tall",
    ]) {
      expect(all).toContain(flag);
    }
    expect(all).toMatch(
      /--rom-directory\s+ROMs directory\. REQUIRED \(ROM parsers only/,
    );

    const glob = parse("create", "--type", "glob", "--help").printed;
    const required = glob.slice(
      glob.indexOf("Required:"),
      glob.indexOf("\n\n", glob.indexOf("Required:")),
    );
    expect(required.match(/--[a-z-]+/g)).toEqual([
      "--type",
      "--parser-type", // (shown as its other name)
      "--name",
      "--rom-directory",
      "--glob",
    ]);
    expect(glob.indexOf("Required:")).toBeLessThan(
      glob.indexOf("Basic Configuration:"),
    );
    // other types' settings and ROM-less settings aren't listed
    expect(glob).not.toContain("--parse-strategy");
    expect(parse("create", "--type", "Steam", "--help").printed).not.toContain(
      "--rom-directory",
    );
  });
});
