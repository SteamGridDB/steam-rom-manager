import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { VDF_ShortcutsFile } from "../../src/lib/vdf-shortcuts-file";
import {
  generateAppId,
  generateShortcutId,
} from "../../src/lib/helpers/steam/generate-app-id";

const shortcutsParser = require("steam-shortcut-editor");

function shortcut(exe: string, appname: string, extra: object = {}) {
  return {
    appid: generateShortcutId(exe, appname),
    appname,
    exe,
    StartDir: path.dirname(exe),
    LaunchOptions: "",
    icon: "",
    tags: [] as string[],
    ...extra,
  };
}

describe("VDF_ShortcutsFile", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "srm-vdf-"));
    file = path.join(dir, "shortcuts.vdf");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("treats a missing file as empty", async () => {
    const vdf = new VDF_ShortcutsFile(file);
    expect(await vdf.read()).toEqual([]);
    expect(vdf.valid).toBe(true);
  });

  it("reads, indexes by long app id, and writes back byte-identical", async () => {
    const original = shortcutsParser.writeBuffer({
      shortcuts: [
        shortcut('"C:\\Emu\\a.exe"', "Game A", { IsHidden: 0 }),
        shortcut('"C:\\Emu\\b.exe"', "Game B", { LastPlayTime: 1700000000 }),
      ],
    });
    fs.writeFileSync(file, original);

    const vdf = new VDF_ShortcutsFile(file);
    await vdf.read();
    expect(vdf.getAppIds()).toEqual([
      generateAppId('"C:\\Emu\\a.exe"', "Game A"),
      generateAppId('"C:\\Emu\\b.exe"', "Game B"),
    ]);
    await vdf.write();
    expect(Buffer.compare(fs.readFileSync(file), original)).toBe(0);
  });

  it("normalizes Steam's inconsistent key casing (issue #715)", async () => {
    fs.writeFileSync(
      file,
      shortcutsParser.writeBuffer({
        shortcuts: [
          {
            appid: 1,
            AppName: "Steam Added",
            Exe: '"C:\\x.exe"',
            StartDir: "C:\\",
            AllowOverlay: 1,
          },
        ],
      }),
    );
    const vdf = new VDF_ShortcutsFile(file);
    const [entry] = (await vdf.read()) as any[];
    expect(entry.appname).toBe("Steam Added");
    expect(entry.exe).toBe('"C:\\x.exe"');
    expect(entry.AppName).toBeUndefined();
    // other keys are kept (steam-shortcut-editor decodes flag fields as bools)
    expect(entry.AllowOverlay).toBe(true);
  });

  it("adds, removes extraneous ids, and persists", async () => {
    const a = shortcut('"C:\\Emu\\a.exe"', "Game A");
    const b = shortcut('"C:\\Emu\\b.exe"', "Game B");
    fs.writeFileSync(file, shortcutsParser.writeBuffer({ shortcuts: [a] }));

    const vdf = new VDF_ShortcutsFile(file);
    await vdf.read();
    const idA = generateAppId(a.exe, a.appname);
    const idB = generateAppId(b.exe, b.appname);
    vdf.addItem(idB, b);
    vdf.addItem(idB, b); // second add of the same id is ignored
    vdf.extraneous = [idA];
    await vdf.write();

    const reread = new VDF_ShortcutsFile(file);
    const data = (await reread.read()) as any[];
    expect(data.map((s) => s.appname)).toEqual(["Game B"]);
    expect(reread.getAppIds()).toEqual([idB]);
  });

  it("reports a corrupted file with the localized message", async () => {
    fs.writeFileSync(file, Buffer.from([0x00, 0x73, 0x68, 0xff, 0x01]));
    const vdf = new VDF_ShortcutsFile(file);
    await expect(vdf.read()).rejects.toThrow(/corrupted/i);
  });
});
