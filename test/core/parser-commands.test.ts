// Creating, editing, deleting and showing parsers from the command line,
// through Core: the same fields, required settings and validation as the
// parser editor.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as paths from "../../src/paths";
import { Core } from "../../src/core/core";
import * as commands from "../../src/core/parser-commands";
import { emptyValue, getFieldValue } from "../../src/core/parser-fields";
import { availableParsers } from "../../src/lib/parsers/available-parsers";
import {
  makeConfig,
  makeFakeSteam,
  makeSettings,
  tempDir,
  writeFiles,
} from "../helpers/fixtures";
import { makeLogger } from "../helpers/services-harness";

describe("parser commands (headless Core)", () => {
  let root: string;
  let steamDir: string;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    root = tempDir("parser-commands");
    steamDir = makeFakeSteam(path.join(root, "steam"), [
      { accountID: "11111111", name: "alice" },
    ]);
    writeFiles(root, ["roms/a.sfc", "emu/snes9x.exe", "manifests/x.json"]);
    for (const file of fs.readdirSync(paths.userDataDir)) {
      fs.rmSync(path.join(paths.userDataDir, file), {
        recursive: true,
        force: true,
      });
    }
    fs.writeFileSync(
      paths.userSettings,
      JSON.stringify(
        makeSettings({
          environmentVariables: { steamDirectory: steamDir },
        }),
      ),
    );
    fs.writeFileSync(
      paths.customVariables,
      JSON.stringify({ Nintendo: { mario: "Super Mario World" } }),
    );
    fs.writeFileSync(
      paths.userConfigurations,
      JSON.stringify([
        makeConfig({
          parserType: "Glob",
          configTitle: "Snes9x (SNES) 📺",
          parserId: "snes",
          romDirectory: path.join(root, "roms"),
          executable: { path: path.join(root, "emu", "snes9x.exe") },
          parserInputs: { glob: "${title}.sfc" },
        }),
        makeConfig({
          parserType: "Steam",
          configTitle: "Steam",
          parserId: "steam",
        }),
      ]),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  async function loadCore() {
    // offline: custom variables come from the file written above
    const core = new Core({
      logger: makeLogger().service,
      fetch: () => Promise.reject(new Error("offline")),
    });
    await core.load({ presets: false });
    return core;
  }
  const onDisk = () =>
    JSON.parse(fs.readFileSync(paths.userConfigurations, "utf8"));

  it("required means what validation means: a required field's empty value fails, an optional one's passes", async () => {
    const core = await loadCore();
    const fields = commands.allFields();
    for (const parserType of availableParsers) {
      const config = makeConfig({ parserType, configTitle: "x" });
      for (const field of fields) {
        if (!field.validation || !field.appliesTo(config)) continue;
        const { key, wrap } = field.validation;
        const empty = emptyValue(field.kind);
        const fails =
          core.parsers.validate(key, wrap ? wrap(empty, config) : empty) !==
          null;
        expect(fails, `${parserType}: --${field.flag}`).toBe(field.required);
      }
    }
  });

  it("every option name is unique", () => {
    const flags = commands.allFields().map((f) => f.flag);
    expect(flags.length).toBe(new Set(flags).size);
  });

  it("create: says what's missing, then creates a valid parser", async () => {
    const core = await loadCore();
    expect(await commands.createParser(core, { name: "x" })).toMatchObject({
      ok: false,
      errors: [
        expect.stringMatching(
          /^Missing --type \(Parser type\)\. One of: Glob, Glob-regex, /,
        ),
      ],
    });
    expect(
      (await commands.createParser(core, { type: "globbb", name: "x" })).errors,
    ).toEqual([
      expect.stringMatching(
        /^--type must be one of: Glob, .* \(got "globbb"\)$/,
      ),
    ]);
    expect(
      (
        await commands.createParser(core, {
          type: "glob",
          name: "My Fancy Parser",
        })
      ).errors,
    ).toEqual([
      "Missing --rom-directory (ROMs directory)",
      expect.stringMatching(/^Missing --glob /),
    ]);

    const created = await commands.createParser(core, {
      type: "glob",
      name: "My Fancy Parser",
      "rom-directory": path.join(root, "roms"),
      glob: "${title}.sfc",
      "steam-categories": ["Puzzle", "Fun"],
      "image-providers": ["SteamGridDB"],
      "sgdb-styles": ["alternate", "no_logo"],
      "steam-input": "disabled",
      "title-from-variable": ["nintendo"],
      "drm-protect": true,
    });
    expect(created.errors).toBeUndefined();
    const saved = onDisk().find(
      (c: any) => c.configTitle === "My Fancy Parser",
    );
    expect(saved).toMatchObject({
      parserType: "Glob",
      parserId: created.value.parserId,
      disabled: false,
      steamCategories: ["Puzzle", "Fun"],
      imageProviders: ["sgdb"],
      imageProviderAPIs: { sgdb: { styles: ["alternate", "no_logo"] } },
      steamInputEnabled: "0",
      titleFromVariable: { limitToGroups: ["Nintendo"] },
      drmProtect: true,
      parserInputs: { glob: "${title}.sfc" },
      steamDirectory: "${steamdirglobal}",
    });
    expect(core.parsers.isConfigurationValid(saved)).toBe(true);
  });

  it("create: bad values, settings that don't apply, unknown options", async () => {
    const core = await loadCore();
    const { errors } = await commands.createParser(core, {
      type: "Steam",
      name: "Mine",
      "rom-directory": path.join(root, "roms"),
      glob: "x",
      "steam-api-key": "k",
      "image-providers": ["sgdb", "nope"],
      "steam-input": "sometimes",
      "drm-protect": "maybe",
      "rom-dir": "x",
    });
    expect(errors).toEqual([
      expect.stringMatching(
        /^--image-providers: "nope" is not allowed\. Choose from: sgdb \(SteamGridDB\), steamCDN \(Steam Official\)$/,
      ),
      expect.stringMatching(
        /^--steam-input must be one of: disabled \(.*\), default \(.*\), enabled \(.*\) \(got "sometimes"\)$/,
      ),
      "--drm-protect is a switch: use --drm-protect or --no-drm-protect",
      "Unknown option --rom-dir",
      "--rom-directory doesn't apply here (ROM parsers only: Glob, Glob-regex)",
      "--glob is a Glob setting; this is a Steam parser",
      "--steam-api-key applies only when --parse-strategy is webapi",
    ]);
    // a path that isn't there
    const bad = await commands.createParser(core, {
      type: "Manual",
      name: "Manual",
      "manual-manifests": path.join(root, "nowhere"),
    });
    expect(bad.errors).toEqual([
      expect.stringMatching(
        /^--manual-manifests ".*nowhere": Directory is invalid!$/,
      ),
    ]);
    expect(onDisk()).toHaveLength(2);
  });

  it("edit: one setting at a time, only valid values; finds parsers by id or name", async () => {
    const core = await loadCore();
    const edited = await commands.editParser(core, "Snes9x (SNES)", {
      "steam-categories": ["Puzzle", "Fun"],
      "no-such": "x",
    });
    expect(edited.errors).toEqual(["Unknown option --no-such"]);

    expect(
      (
        await commands.editParser(core, "snes", {
          "rom-directory": path.join(root, "gone"),
        })
      ).errors,
    ).toEqual([
      expect.stringMatching(
        /^--rom-directory ".*gone": ROMs directory is invalid!$/,
      ),
    ]);
    expect(
      (
        await commands.editParser(core, "snes", {
          "steam-input": "2",
          name: "SNES",
        })
      ).value.changed,
    ).toEqual(["--steam-input", "--name"]);
    expect(onDisk()[0]).toMatchObject({
      parserId: "snes",
      configTitle: "SNES",
      steamInputEnabled: "2",
    });
    expect((await commands.editParser(core, "snes", {})).errors).toEqual([
      "Nothing to change: give at least one setting (see srm edit --help)",
    ]);
    expect(
      (await commands.editParser(core, "nope", { name: "x" })).errors,
    ).toEqual(['No parser with id or name "nope" (see "srm list")']);
    // changing the type checks the whole parser against the new type
    expect(
      (await commands.editParser(core, "steam", { type: "Glob" })).errors,
    ).toEqual([
      "Missing --rom-directory (ROMs directory)",
      expect.stringMatching(/^Missing --glob /),
    ]);
  });

  it("view: the named settings in order, or all that apply", async () => {
    const core = await loadCore();
    const { rows } = commands.viewParser(core, "Snes9x (SNES)", [
      "type",
      "name",
      "steam-categories",
    ]).value;
    expect(rows.map((r) => [r.flag, r.raw, r.value])).toEqual([
      ["--type", "Glob", '"Glob"'],
      ["--name", "Snes9x (SNES) 📺", '"Snes9x (SNES) 📺"'],
      ["--steam-categories", "", "(none)"],
    ]);
    // a setting this parser doesn't use says so
    expect(
      commands.viewParser(core, "steam", ["rom-directory"]).value.rows[0]
        .unused,
    ).toBe(
      "--rom-directory doesn't apply here (ROM parsers only: Glob, Glob-regex)",
    );
    expect(commands.viewParser(core, "steam", ["nope"]).errors).toEqual([
      "Unknown option --nope",
    ]);
  });

  it("delete: all or nothing; show: the settings that apply", async () => {
    const core = await loadCore();
    expect(commands.deleteParsers(core, ["snes", "nope"]).errors).toEqual([
      'No parser with id or name "nope" (see "srm list")',
    ]);
    expect(onDisk()).toHaveLength(2);
    const shown = commands.viewParser(core, "steam").value.rows;
    expect(shown.map((r) => r.flag)).toContain("--parse-strategy");
    expect(shown.map((r) => r.flag)).not.toContain("--rom-directory");
    expect(commands.deleteParsers(core, ["steam"]).value).toHaveLength(1);
    expect(onDisk().map((c: any) => c.parserId)).toEqual(["snes"]);
    expect(getFieldValue(onDisk()[0], { path: ["configTitle"] } as any)).toBe(
      "Snes9x (SNES) 📺",
    );
  });
});
