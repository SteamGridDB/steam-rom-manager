import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as paths from "../../src/paths";
import { EpicParser } from "../../src/lib/parsers/epic.parser";
import { tempDir } from "../helpers/fixtures";

describe.runIf(os.type() === "Windows_NT")("Epic parser", () => {
  const root = tempDir("epic");
  const manifests = path.join(root, "Manifests");
  const scriptPath = path.join(paths.userDataDir, "scripts", "epic.ps1");
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  beforeAll(() => {
    const installDir = path.join(root, "Games", "Game One");
    fs.mkdirSync(installDir, { recursive: true });
    fs.writeFileSync(path.join(installDir, "GameOne.exe"), "");
    fs.mkdirSync(manifests, { recursive: true });
    fs.writeFileSync(
      path.join(manifests, "ONE.item"),
      JSON.stringify({
        DisplayName: "Game One",
        AppName: "gameone",
        InstallLocation: installDir,
        LaunchExecutable: "GameOne.exe",
        LaunchCommand: "-fast",
      }),
    );
  });

  const parse = (inputs: { [key: string]: any }) =>
    new EpicParser().execute([], { epicManifests: manifests, ...inputs });

  it("launches through the Epic URL by default", async () => {
    const result = await parse({ epicLauncherMode: true });
    expect(result.executableLocation).toMatch(/powershell\.exe$/);
    expect(result.success[0].launchOptions).toContain(
      "com.epicgames.launcher://apps/gameone?action=launch&silent=true",
    );
  });

  it("fails with the expected path when epic.ps1 is missing", async () => {
    await expect(
      parse({ epicLauncherMode: true, epicWaitForExit: true }),
    ).rejects.toContain(scriptPath);
  });

  it("runs epic.ps1 through a headless conhost when waiting for the game to exit", async () => {
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, "");
    const result = await parse({
      epicLauncherMode: true,
      epicWaitForExit: true,
    });
    expect(result.executableLocation).toBe(
      "C:\\Windows\\System32\\conhost.exe",
    );
    expect(result.success[0].launchOptions).toBe(
      `--headless powershell.exe -NoP -EP Bypass -File "${scriptPath}" -appName "gameone" -manifestsDir "${manifests}"`,
    );
  });

  it("ignores the option when not launching via Epic", async () => {
    const result = await parse({ epicWaitForExit: true });
    expect(result.executableLocation).toMatch(/powershell\.exe$/);
    expect(result.success[0].fileLaunchOptions).toBe("-fast");
  });
});
