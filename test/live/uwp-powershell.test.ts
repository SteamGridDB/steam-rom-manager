// The UWP parser's PowerShell batches, against apps installed on this
// (Windows) machine. Read-only.
import { describe, expect, it } from "vitest";
import * as os from "os";
import { XMLParser } from "fast-xml-parser";
import { getUWPAppDetails } from "../../src/lib/parsers/UWP.parser";

describe.runIf(os.type() === "Windows_NT")("UWP parser (PowerShell)", () => {
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

  it("no games: no PowerShell", async () => {
    expect(await getUWPAppDetails([], new XMLParser())).toEqual([]);
  });
});
