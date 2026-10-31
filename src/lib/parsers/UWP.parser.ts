import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as json from "../helpers/json";
import { spawn } from "child_process";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { SimpleUWPApp, SimpleManifest } from "../../models";
import { glob } from "glob";

export class UWPParser implements GenericParser {
  private get lang() {
    return APP.lang.UWPParser;
  }

  getParserInfo(): ParserInfo {
    return {
      title: "UWP",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        UWPDir: {
          label: this.lang.UWPDirTitle,
          placeholder: this.lang.UWPDirPlaceholder[APP.osType],
          inputType: "dir",
          info: this.lang.docs__md.input.join(""),
        },
        UWPLauncherMode: {
          label: this.lang.UWPLauncherModeTitle,
          inputType: "toggle",
          info: this.lang.docs__md.input.join(""),
        },
      },
    };
  }

  execute(
    directories: string[],
    inputs: { [key: string]: any },
    cache?: { [key: string]: any },
  ): Promise<ParsedData> {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (os.type() !== "Windows_NT") {
        return reject(this.lang.errors.UWPNotCompatible);
      }
      try {
        const xmlParser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
        });
        const UWPDir: string = inputs.UWPDir || "C:\\XboxGames";
        const files = await glob("*/{,Content/}appxmanifest.xml", {
          cwd: UWPDir,
        });
        let finalData: ParsedData = {
          executableLocation: "C:\\WINDOWS\\explorer.exe",
          success: [],
          failed: [],
        };
        const manifests: SimpleManifest[] = [];
        const identities = new Set<string>();
        for (let prefile of files) {
          const file = path.join(UWPDir, prefile);
          if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            const xmldata = fs.readFileSync(file, "utf-8");
            if (XMLValidator.validate(xmldata) === true) {
              const parsedData: any = xmlParser.parse(xmldata);
              if (
                !json.caselessHas(parsedData, [
                  ["Package"],
                  ["Properties"],
                  ["PublisherDisplayName"],
                ]) ||
                json.caselessGet(parsedData, [
                  ["Package"],
                  ["Properties"],
                  ["PublisherDisplayName"],
                ]) == "Microsoft Corporation"
              ) {
                continue;
              }
              if (
                json.caselessHas(parsedData, [
                  ["Package"],
                  ["Applications"],
                  ["Application"],
                ])
              ) {
                let app: any = json.caselessGet(parsedData, [
                  ["Package"],
                  ["Applications"],
                  ["Application"],
                ]);
                if (Array.isArray(app)) {
                  app = app.filter((x) =>
                    json.caselessHas(x, [["@_Executable"]]),
                  )[0];
                }
                if (json.caselessHas(app, [["@_Executable"]])) {
                  const gameManifest: SimpleManifest = {
                    idName: json.caselessGet(parsedData, [
                      ["Package"],
                      ["Identity"],
                      ["@_Name"],
                    ]),
                    idPublisher: json.caselessGet(parsedData, [
                      ["Package"],
                      ["Identity"],
                      ["@_Publisher"],
                    ]),
                    appExecutable: json.caselessGet(app, [["@_Executable"]]),
                  } as SimpleManifest;
                  // (once per package: an updated app's old version folders
                  // stay behind, all for the same installed package)
                  const identity = `${gameManifest.idName}|${gameManifest.idPublisher}`;
                  if (
                    gameManifest.idName &&
                    gameManifest.idPublisher &&
                    gameManifest.appExecutable &&
                    !identities.has(identity)
                  ) {
                    identities.add(identity);
                    manifests.push(gameManifest);
                  }
                }
              }
            }
          }
        }
        // (all the games at once: PowerShell starts twice, not per game)
        for (const gameDetail of await getUWPAppDetails(manifests, xmlParser)) {
          if (gameDetail.name && gameDetail.appId && gameDetail.path) {
            finalData.success.push({
              extractedTitle: gameDetail.name,
              launchOptions: gameDetail.arguments,
              filePath: gameDetail.path,
              //fileLaunchOptions: not available
            });
          }
        }
        resolve(finalData);
      } catch (err) {
        reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
      }
    });
  }
}

// Runs a PowerShell script once with JSON input; returns its JSON output.
// (One process for a whole batch: starting PowerShell takes about a
// second, once per game added up.)
async function runPowerShell(script: string, input: unknown): Promise<any> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "srm-uwp-"));
  const scriptPath = path.join(dir, "script.ps1");
  const inputPath = path.join(dir, "input.json");
  try {
    // (a BOM: Windows PowerShell reads scripts without one as ANSI)
    await fs.writeFile(scriptPath, "﻿" + script, "utf8");
    await fs.writeFile(inputPath, JSON.stringify(input), "utf8");
    const { stdout, stderr, code } = await new Promise<{
      stdout: string;
      stderr: string;
      code: number;
    }>((resolve, reject) => {
      const child = spawn(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          scriptPath,
          "-InputPath",
          inputPath,
        ],
        { windowsHide: true },
      );
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      child.stdout.on("data", (chunk) => out.push(chunk));
      child.stderr.on("data", (chunk) => err.push(chunk));
      child.on("error", reject);
      // (all of the output: it can arrive in several chunks)
      child.on("close", (code) =>
        resolve({
          stdout: Buffer.concat(out).toString("utf8"),
          stderr: Buffer.concat(err).toString("utf8"),
          code,
        }),
      );
    });
    const text = stdout.replace(/^﻿/, "").trim();
    if (code !== 0 || !text) {
      throw new Error(stderr.trim() || `PowerShell exited with ${code}`);
    }
    return JSON.parse(text);
  } finally {
    await fs.remove(dir);
  }
}

// The installed package of each game (by its manifest's name and
// publisher), all in one PowerShell run.
const findPackagesScript = `param($InputPath)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$items = Get-Content -Raw -Encoding UTF8 $InputPath | ConvertFrom-Json
$PkgMgr = [Windows.Management.Deployment.PackageManager,Windows.Web,ContentType=WindowsRuntime]::new()
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$results = @(foreach ($item in $items) {
  $package = $PkgMgr.FindPackagesForUser($user, $item.idName, $item.idPublisher) | Select-Object -First 1
  if ($package) {
    $installed = if ($package.InstalledLocation) { $package.InstalledLocation.Path } else { $package.InstalledPath }
    [pscustomobject]@{
      key = $item.key
      IsFramework = $package.IsFramework
      IsResourcePackage = $package.IsResourcePackage
      SignatureKind = [int]$package.SignatureKind
      IsBundle = $package.IsBundle
      InstalledPath = $installed
      FullName = $package.Id.FullName
      Name = $package.Id.Name
      FamilyName = $package.Id.FamilyName
    }
  }
})
ConvertTo-Json -InputObject $results -Depth 3 -Compress
`;

// Resolves indirect strings ("@{Package? ms-resource://...}") to text, all
// in one PowerShell run: { source: text } for the ones that resolve.
// Inspired by https://github.com/JosefNemec/Playnite/blob/master/source/Playnite/Common/Resources.cs
const loadIndirectStringsScript = `param($InputPath)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# (not @(...): Windows PowerShell's ConvertFrom-Json emits an array as one
# object, which @() would wrap in another array)
$sources = Get-Content -Raw -Encoding UTF8 $InputPath | ConvertFrom-Json
Add-Type -MemberDefinition @"
[DllImport("shlwapi.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
public static extern int SHLoadIndirectString(string pszSource, System.Text.StringBuilder pszOutBuf, uint cchOutBuf, IntPtr ppvReserved);
"@ -Name Shlwapi -Namespace Win32
$out = @{}
foreach ($source in $sources) {
  $sb = [System.Text.StringBuilder]::new(1024)
  if ([Win32.Shlwapi]::SHLoadIndirectString($source, $sb, $sb.Capacity, [IntPtr]::Zero) -eq 0) {
    $out[$source] = $sb.ToString()
  }
}
ConvertTo-Json -InputObject $out -Compress
`;

// The indirect strings to try for a ms-resource display name, best first.
const indirectStringCandidates = (
  fullName: string,
  packageName: string,
  resource: string,
) => {
  const lastSegment = new URL(resource).pathname.split("/").reverse()[0];
  let first: string;
  if (resource.startsWith("ms-resource://")) {
    first = `@{${fullName}? ${resource}}`;
  } else if (resource.includes("/")) {
    const cleanResource = resource
      .replace("ms-resource:", "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    first = `@{${fullName}? ms-resource://${packageName}/${cleanResource}}`;
  } else {
    first = `@{${fullName}? ms-resource://${packageName}/resources/${lastSegment}}`;
  }
  return [first, `@{${fullName}? ms-resource://${packageName}/${lastSegment}}`];
};

interface FoundPackage {
  key: number;
  IsFramework: boolean;
  IsResourcePackage: boolean;
  SignatureKind: number;
  IsBundle: boolean;
  InstalledPath: string;
  FullName: string;
  Name: string;
  FamilyName: string;
}

// The games' details (name, path, launch arguments): the package lookup and
// the display names each take one PowerShell run for all of them.
export const getUWPAppDetails = async (
  manifests: SimpleManifest[],
  xmlParser: XMLParser,
): Promise<SimpleUWPApp[]> => {
  if (!manifests.length) return [];
  const packages: FoundPackage[] = await runPowerShell(
    findPackagesScript,
    manifests.map((m, key) => ({
      key,
      idName: m.idName,
      idPublisher: m.idPublisher,
    })),
  );
  const found: {
    manifest: SimpleManifest;
    pkg: FoundPackage;
    appId: string;
    executable: string;
    name: string;
    fallbackName: string;
  }[] = [];
  for (const pkg of packages ?? []) {
    if (
      pkg.IsFramework ||
      pkg.IsResourcePackage ||
      pkg.SignatureKind != 3 // https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.packagesignaturekind
    ) {
      continue;
    }
    try {
      const manifestPath = path.join(
        pkg.InstalledPath,
        pkg.IsBundle
          ? "AppxMetadataAppxBundleManifest.xml"
          : "AppxManifest.xml",
      );
      const xml = fs.readFileSync(manifestPath, "utf8");
      if (XMLValidator.validate(xml) !== true) continue;
      const parsedData: any = xmlParser.parse(xml);
      let apxApp: any = json.caselessGet(parsedData, [
        ["Package"],
        ["Applications"],
        ["Application"],
      ]);
      if (Array.isArray(apxApp)) {
        apxApp = apxApp.filter((x) =>
          json.caselessHas(x, [["@_Executable"]]),
        )[0];
      }
      found.push({
        manifest: manifests[pkg.key],
        pkg,
        appId: json.caselessGet(apxApp, [["@_Id"]]),
        // (the installed version's: the manifest found may be an old one's)
        executable:
          json.caselessGet(apxApp, [["@_Executable"]]) ||
          manifests[pkg.key].appExecutable,
        name: String(
          json.caselessGet(parsedData, [
            ["Package"],
            ["Properties"],
            ["DisplayName"],
          ]),
        ),
        fallbackName: json.caselessGet(parsedData, [
          ["Package"],
          ["Identity"],
          ["@_Name"],
        ]),
      });
    } catch (err) {
      console.error("Error parsing xml files: " + err);
    }
  }

  // Display names that are resource references, resolved together.
  const candidates = new Map<string, string[]>();
  for (const game of found) {
    if (game.name.startsWith("ms-resource")) {
      candidates.set(
        game.name + "|" + game.pkg.FullName,
        indirectStringCandidates(game.pkg.FullName, game.pkg.Name, game.name),
      );
    }
  }
  let resolved: Record<string, string> = {};
  if (candidates.size) {
    try {
      resolved = await runPowerShell(
        loadIndirectStringsScript,
        [...candidates.values()].flat(),
      );
    } catch (err) {
      console.error("Error resolving display names: " + err);
    }
  }

  return found.map(({ pkg, appId, executable, name, fallbackName }) => {
    if (name.startsWith("ms-resource")) {
      const tries = candidates.get(name + "|" + pkg.FullName);
      name = tries.map((source) => resolved[source]).find((x) => !!x) || "";
      if (!name) name = fallbackName;
    }
    return {
      name,
      workdir: pkg.InstalledPath,
      path: path.join(pkg.InstalledPath, executable).toString(),
      arguments: `shell:AppsFolder\\${pkg.FamilyName}!${appId}`,
      appId: pkg.FamilyName,
    } as SimpleUWPApp;
  });
};
