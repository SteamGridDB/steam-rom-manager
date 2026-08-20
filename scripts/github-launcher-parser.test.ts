import { strict as assert } from "assert";
import * as path from "path";

const githubLauncherDir = path.resolve("GitHubLauncher");
const appsPath = path.resolve("library", "Apps");
const externalInstallPath = path.resolve("custom-library", "ExternalGame");
const largestInstallPath = path.resolve("custom-library", "LargestGame");
const missingInstallPath = path.resolve("custom-library", "MissingGame");

let settings = { AppsPath: appsPath };
let apps: { apps: any[] } = { apps: [] };
let existingPaths = new Set<string>();
let executableNames = new Map<string, string[]>();
let executableSizes = new Map<string, number>();

const nodeModule = require("module");
const originalLoad = nodeModule._load;
nodeModule._load = (request: string, ...args: any[]) => {
  if (request === "../../models" || request === "lodash") {
    return {};
  }
  if (request === "../../variables") {
    return { APP: {} };
  }
  if (request === "os") {
    return { type: () => "Windows_NT" };
  }
  if (request === "fs-extra") {
    return {
      existsSync: (filePath: string) => existingPaths.has(filePath),
      readJsonSync: (filePath: string) =>
        path.basename(filePath) === "settings.json" ? settings : apps,
      promises: {
        stat: async (filePath: string) => ({
          size: executableSizes.get(filePath) || 0,
        }),
      },
    };
  }
  if (request === "glob") {
    return {
      glob: async (_pattern: string, options: { cwd: string }) =>
        executableNames.get(options.cwd) || [],
    };
  }
  return originalLoad(request, ...args);
};

const {
  GithubLauncherParser,
  resolveGithubLauncherGameDir,
} = require("../src/lib/parsers/github-launcher.parser");
nodeModule._load = originalLoad;

assert.equal(
  resolveGithubLauncherGameDir(
    githubLauncherDir,
    appsPath,
    "GameFolder",
    externalInstallPath,
  ),
  externalInstallPath,
  "uses the app install path when one is configured",
);

assert.equal(
  resolveGithubLauncherGameDir(githubLauncherDir, appsPath, "GameFolder", ""),
  path.join(appsPath, "GameFolder"),
  "falls back to AppsPath for an empty app install path",
);

assert.equal(
  resolveGithubLauncherGameDir(githubLauncherDir, appsPath, "GameFolder"),
  path.join(appsPath, "GameFolder"),
  "falls back to AppsPath for a missing app install path",
);

assert.equal(
  resolveGithubLauncherGameDir(githubLauncherDir, "", "GameFolder"),
  path.join(githubLauncherDir, "Apps", "GameFolder"),
  "falls back to the launcher's Apps directory for an empty AppsPath",
);

async function testParserExecution() {
  const legacyInstallPath = path.join(appsPath, "LegacyGame");
  const largestExecutable = path.join(largestInstallPath, "game.exe");
  apps = {
    apps: [
      {
        name: "External Game",
        folderName: "IgnoredFolder",
        installPath: externalInstallPath,
      },
      { name: "Legacy Game", folderName: "LegacyGame", installPath: "" },
      {
        name: "Missing Game",
        folderName: "IgnoredFolder",
        installPath: missingInstallPath,
      },
      {
        name: "Largest Game",
        folderName: "IgnoredFolder",
        installPath: largestInstallPath,
      },
    ],
  };
  existingPaths = new Set([
    githubLauncherDir,
    externalInstallPath,
    legacyInstallPath,
    largestInstallPath,
  ]);
  executableNames = new Map([
    [externalInstallPath, ["external.exe"]],
    [legacyInstallPath, ["legacy.exe"]],
    [largestInstallPath, ["uninstaller.exe", "game.exe"]],
  ]);
  executableSizes = new Map([
    [path.join(largestInstallPath, "uninstaller.exe"), 10],
    [largestExecutable, 100],
  ]);

  const parser = new GithubLauncherParser();
  const parsedData = await parser.execute([], { githubLauncherDir });

  assert.deepEqual(parsedData.success, [
    {
      extractedTitle: "External Game",
      filePath: path.join(externalInstallPath, "external.exe"),
    },
    {
      extractedTitle: "Legacy Game",
      filePath: path.join(legacyInstallPath, "legacy.exe"),
    },
    { extractedTitle: "Largest Game", filePath: largestExecutable },
  ]);
  assert.deepEqual(parsedData.failed, [
    `Game folder ${missingInstallPath} does not exist`,
  ]);

  settings = { AppsPath: "" };
  const defaultInstallPath = path.join(
    githubLauncherDir,
    "Apps",
    "DefaultGame",
  );
  apps = { apps: [{ name: "Default Game", folderName: "DefaultGame" }] };
  existingPaths = new Set([githubLauncherDir, defaultInstallPath]);
  executableNames = new Map([[defaultInstallPath, ["default.exe"]]]);

  const defaultParsedData = await parser.execute([], { githubLauncherDir });
  assert.deepEqual(defaultParsedData.success, [
    {
      extractedTitle: "Default Game",
      filePath: path.join(defaultInstallPath, "default.exe"),
    },
  ]);
  assert.deepEqual(defaultParsedData.failed, []);
}

testParserExecution()
  .then(() => console.log("GitHub Launcher parser tests passed"))
  .catch((error: Error) => {
    console.error(error);
    process.exitCode = 1;
  });
