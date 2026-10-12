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
      names: false,
      only: false,
    });
    expect(parse("disable", "--all").request).toMatchObject({
      command: "disable",
      all: true,
    });
    expect(
      parse("enable", "--names", "Snes9x (SNES)", "Dolphin (GameCube)").request,
    ).toMatchObject({
      command: "enable",
      names: true,
      parsers: ["Snes9x (SNES)", "Dolphin (GameCube)"],
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
    expect(
      parse("remove", "--only", "--names", "Snes9x (SNES)").request,
    ).toMatchObject({
      command: "remove",
      only: true,
      names: true,
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
    expect(addHelp).toContain("--names");
  });
});
