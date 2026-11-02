import { afterAll, afterEach, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { LegendaryParser } from "../../src/lib/parsers/legendary.parser";
import { tempDir } from "../helpers/fixtures";

describe("Legendary parser", () => {
  const root = tempDir("legendary");
  const installed = path.join(root, "installed.json");
  fs.writeFileSync(
    installed,
    JSON.stringify({
      Fortnite: {
        app_name: "Fortnite",
        title: "Fortnite",
        install_path: path.join(root, "Fortnite"),
        executable: "Fortnite.exe",
        launch_parameters: "",
        is_dlc: false,
      },
    }),
  );
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  const exe = path.join(
    bin,
    os.type() === "Windows_NT" ? "legendary.exe" : "legendary",
  );
  fs.writeFileSync(exe, "");
  fs.chmodSync(exe, 0o755);
  const originalPath = process.env.PATH;
  afterEach(() => {
    process.env.PATH = originalPath;
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  it("finds legendary on PATH, without the line break after it (#719)", async () => {
    process.env.PATH = bin + path.delimiter + originalPath;
    const result = await new LegendaryParser().execute([], {
      legendaryInstalledFile: installed,
    });
    expect(result.executableLocation).not.toMatch(/\s$/);
    expect(fs.realpathSync.native(result.executableLocation)).toBe(
      fs.realpathSync.native(exe),
    );
    expect(result.success.map((s) => s.launchOptions)).toEqual([
      "launch Fortnite",
    ]);
  });

  it("not on PATH: says legendary isn't installed (it used to hang)", async () => {
    process.env.PATH = path.join(root, "empty");
    await expect(
      new LegendaryParser().execute([], { legendaryInstalledFile: installed }),
    ).rejects.toBeDefined();
  });
});
