// The UWP parser's PowerShell batches, against apps installed on this
// Windows machine (Calculator, and whatever is in WindowsApps). Read-only.
// Opt-in, like the other live tests (CI's Windows Server has no Calculator):
//   SRM_LIVE_UWP=1
import { describe, expect, it } from "vitest";
import * as os from "os";
import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import { getUWPAppDetails, UWPParser } from "../../src/lib/parsers/UWP.parser";

it("UWP parser: no games, no PowerShell", async () => {
  expect(await getUWPAppDetails([], new XMLParser())).toEqual([]);
});

describe.runIf(os.type() === "Windows_NT" && !!process.env.SRM_LIVE_UWP)("UWP parser (PowerShell)", () => {
  it("finds installed packages and resolves ms-resource names in one run each", async () => {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const publisher =
      "CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US";
    const started = Date.now();
    const apps = await getUWPAppDetails(
      [
        {
          idName: "Microsoft.WindowsCalculator",
          idPublisher: publisher,
          appExecutable: "CalculatorApp.exe",
        },
        {
          idName: "Not.An.Installed.Package",
          idPublisher: publisher,
          appExecutable: "x.exe",
        },
      ],
      xmlParser,
    );
    expect(apps).toHaveLength(1);
    const [calculator] = apps;
    // (its display name resolved: not the ms-resource reference, nor the
    // package name used when that fails; localized, so not matched exactly)
    expect(calculator.name).not.toMatch(/^ms-resource/);
    expect(calculator.name).not.toBe("Microsoft.WindowsCalculator");
    expect(calculator.appId).toMatch(/^Microsoft\.WindowsCalculator_/);
    expect(calculator.arguments).toMatch(
      /^shell:AppsFolder\\Microsoft\.WindowsCalculator_\w+!App$/,
    );
    expect(calculator.path).toMatch(/CalculatorApp\.exe$/);
    console.log(`2 games in ${Date.now() - started} ms:`, calculator);
  }, 60000);

  it("each installed app once, at the installed version's executable", async () => {
    // (an updated app's old version folders stay in WindowsApps: each one
    // used to add the app again, with that version's executable)
    const { success } = await new UWPParser().execute([], {
      UWPDir: "C:\\Program Files\\WindowsApps",
      UWPLauncherMode: true,
    });
    const launches = success.map((s) => s.launchOptions);
    expect(new Set(launches).size).toBe(launches.length);
    for (const s of success) expect(fs.existsSync(s.filePath), s.filePath).toBe(true);
  }, 120000);
});
