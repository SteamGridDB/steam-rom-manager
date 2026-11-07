import { afterAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { EpicParser } from "../../src/lib/parsers/epic.parser";
import { parserScript } from "../../src/lib/launch-wrapper";
import { tempDir } from "../helpers/fixtures";

describe.runIf(os.type() === "Windows_NT")(
  "Epic parser: wait for the game to exit",
  () => {
    const root = tempDir("epic");
    afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
    const manifests = path.join(root, "Manifests");
    const install = path.join(root, "Games", "Dredge");
    fs.mkdirSync(manifests, { recursive: true });
    fs.mkdirSync(install, { recursive: true });
    fs.writeFileSync(path.join(install, "DREDGE.exe"), "");
    fs.writeFileSync(
      path.join(manifests, "dredge.item"),
      JSON.stringify({
        DisplayName: "DREDGE",
        AppName: "Bluegill",
        InstallLocation: install,
        LaunchExecutable: "DREDGE.exe",
        LaunchCommand: "",
      }),
    );
    const parse = (inputs: object) =>
      new EpicParser().execute([], { epicManifests: manifests, ...inputs });

    it("hands the launch to Epic through SRM's launch script, which watches the game's folder", async () => {
      const { success } = await parse({
        epicLauncherMode: true,
        epicWaitForExit: true,
      });
      expect(success[0].launchWrapper).toEqual({
        launch: {
          file: "com.epicgames.launcher://apps/Bluegill?action=launch&silent=true",
        },
        game: { folder: install, exeName: "DREDGE.exe" },
        preLaunch: [{ script: parserScript("epic-stop.ps1") }],
        postLaunch: [
          {
            script: parserScript("epic-cloud-sync.ps1"),
            args: ["-appName", "Bluegill", "-Mark"],
          },
        ],
        postExit: [
          {
            script: parserScript("epic-cloud-sync.ps1"),
            args: ["-appName", "Bluegill"],
          },
          { script: parserScript("epic-stop.ps1") },
        ],
      });
    });

    it("only when launching via Epic", async () => {
      for (const inputs of [
        { epicLauncherMode: false, epicWaitForExit: true },
        { epicLauncherMode: true, epicWaitForExit: false },
      ]) {
        const { success } = await parse(inputs);
        expect(success[0].launchWrapper).toBeUndefined();
      }
    });
  },
);
