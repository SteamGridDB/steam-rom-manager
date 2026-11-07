import * as fs from "fs-extra";
import * as path from "path";
import {
  LaunchScript,
  LaunchWrapper,
  ParserLaunchWrapper,
  ScriptWrapperConfig,
} from "../../models";
import * as paths from "../../paths";

// Launch wrappers. A wrapped game's shortcut doesn't start the game: it runs
// a small file SRM writes for the game (launch-wrappers/<Steam user>/
// <short app id>.ps1 or .sh), which calls SRM's launch script with the
// game's settings. That script runs the scripts of each stage (the user's
// from the parser's "Script wrapper configuration", and any a parser adds),
// starts the game and waits for it to exit. Everything that runs scripts
// around a launch goes through here.
//
// Steam cuts launch options off at 259 characters, hence a file per game
// rather than everything on the command line. The shortcut's executable is
// the same for every wrapped game (PowerShell through a hidden console on
// Windows, sh elsewhere), so its app id comes from its title alone.

export type WrapperOS = "Windows" | "Unix";

export function wrapperOS(): WrapperOS {
  return process.platform === "win32" ? "Windows" : "Unix";
}

// SRM's launch script and the scripts parsers use (bundled as text), written
// out (again) on every save so they match this version of SRM.
const bundledScripts = (): Record<string, string> => ({
  "srm-launch.ps1": require("./srm-launch.ps1"),
  "srm-launch.sh": require("./srm-launch.sh"),
  "scripts/battle-net-start.ps1": require("./scripts/battle-net-start.ps1"),
  "scripts/epic-stop.ps1": require("./scripts/epic-stop.ps1"),
  "scripts/epic-cloud-sync.ps1": require("./scripts/epic-cloud-sync.ps1"),
});

// Where a parser's own script is, once installed.
export function parserScript(name: string) {
  return path.join(paths.launchWrappersDir, "scripts", name);
}

export const launchLog = () => path.join(paths.launchWrappersDir, "launch.log");

// The shortcut's executable for any wrapped game.
export function wrapperExecutable(os: WrapperOS = wrapperOS()) {
  return os === "Windows"
    ? `"${path.win32.join(process.env.SystemRoot || "C:\\Windows", "System32", "conhost.exe")}"`
    : `"/bin/sh"`;
}

// A wrapped game's file.
export function wrapperFile(
  accountId: string,
  shortAppId: string,
  os: WrapperOS = wrapperOS(),
) {
  return path.join(
    paths.launchWrappersDir,
    accountId,
    `${shortAppId}.${os === "Windows" ? "ps1" : "sh"}`,
  );
}

// The shortcut's launch options for a wrapped game: run its file (on
// Windows through a hidden console, as PowerShell would show one).
export function wrapperArguments(file: string, os: WrapperOS = wrapperOS()) {
  return os === "Windows"
    ? `--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${file}"`
    : shellQuote(file);
}

// A parsed game's wrapper: when the parser's "Wrap shortcut in a shell
// script" is on, or the parser adds one of its own. Parser scripts run
// inside the user's: after the user's pre-launch script, before their
// post-launch and post-exit ones. `target` is the game's executable (with
// any arguments appended to it).
export function makeLaunchWrapper(
  target: string,
  user: ScriptWrapperConfig | undefined,
  parser: ParserLaunchWrapper | undefined,
): LaunchWrapper | undefined {
  const enabled = !!user?.enabled;
  if (!enabled && !parser) return undefined;
  const userStep = (stage: keyof Omit<ScriptWrapperConfig, "enabled">) => {
    const step = enabled ? user[stage] : undefined;
    const script = step?.script?.trim();
    return script
      ? [{ script, delay: Math.max(0, Number(step.delay) || 0) }]
      : [];
  };
  return {
    target,
    ...(parser?.launch && { launch: parser.launch }),
    ...(parser?.game && { game: parser.game }),
    preLaunch: [...userStep("preLaunch"), ...(parser?.preLaunch ?? [])],
    postLaunch: [...(parser?.postLaunch ?? []), ...userStep("postLaunch")],
    postExit: [...(parser?.postExit ?? []), ...userStep("postExit")],
  };
}

// The game's command line as Steam would run it: the launch options after
// the executable, or in place of %command% when they have it.
export function gameCommand(target: string, launchOptions: string) {
  const options = (launchOptions ?? "").trim();
  if (options.includes("%command%")) {
    return options.replace(/%command%/g, () => target);
  }
  return options ? `${target} ${options}` : target;
}

// '"C:\Games\x.exe" -a b' -> the file and its arguments (Windows starts
// them apart).
export function splitCommand(command: string) {
  const c = command.trim();
  const m = c.startsWith('"')
    ? c.match(/^"([^"]*)"\s*([\s\S]*)$/)
    : c.match(/^(\S+)\s*([\s\S]*)$/);
  return m ? { file: m[1], arguments: m[2] } : { file: c, arguments: "" };
}

// A word for sh, quoted.
export function shellQuote(s: string) {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export interface WrappedGame {
  title: string;
  wrapper: LaunchWrapper;
  // The game's launch options (Steam's), and where it starts.
  launchOptions: string;
  startInDirectory: string;
}

// The file a wrapped game's shortcut runs.
export function wrapperFileContent(
  game: WrappedGame,
  os: WrapperOS = wrapperOS(),
) {
  const { wrapper } = game;
  const title = game.title.replace(/[\r\n]+/g, " ");
  const startDir = (game.startInDirectory ?? "").replace(/"/g, "");
  const command = gameCommand(wrapper.target, game.launchOptions);
  const header = [
    `Steam ROM Manager launch wrapper for "${title}".`,
    "SRM writes this file when it saves the game to Steam; changes to it are",
    "overwritten. Its scripts' output and failures go to ../launch.log.",
  ];
  if (os === "Windows") {
    const launch = wrapper.launch ?? splitCommand(command);
    const config = {
      title,
      log: launchLog(),
      file: launch.file,
      arguments: launch.arguments ?? "",
      workingDirectory: startDir,
      game: wrapper.game ?? null,
      preLaunch: wrapper.preLaunch,
      postLaunch: wrapper.postLaunch,
      postExit: wrapper.postExit,
    };
    // (a here-string: nothing in it is interpreted; JSON lines never
    // start with '@, which would end it)
    return [
      ...header.map((line) => `# ${line}`),
      "$config = @'",
      JSON.stringify(config, null, 2),
      "'@ | ConvertFrom-Json",
      "& (Join-Path (Split-Path $PSScriptRoot -Parent) 'srm-launch.ps1') -Config $config",
      "",
    ].join("\r\n");
  }
  const launchCommand = wrapper.launch
    ? [shellQuote(wrapper.launch.file), wrapper.launch.arguments ?? ""]
        .join(" ")
        .trim()
    : command;
  const steps = (prefix: string, scripts: LaunchScript[]) => [
    `${prefix}_COUNT=${scripts.length}`,
    ...scripts.flatMap((step, i) => [
      `${prefix}_${i + 1}_SCRIPT=${shellQuote(step.script)}`,
      `${prefix}_${i + 1}_ARGS=${shellQuote((step.args ?? []).map(shellQuote).join(" "))}`,
      `${prefix}_${i + 1}_DELAY=${Math.max(0, Number(step.delay) || 0)}`,
    ]),
  ];
  return [
    "#!/bin/sh",
    ...header.map((line) => `# ${line}`),
    `SRM_TITLE=${shellQuote(title)}`,
    `SRM_LOG=${shellQuote(launchLog())}`,
    `SRM_COMMAND=${shellQuote(launchCommand)}`,
    `SRM_START_DIR=${shellQuote(startDir)}`,
    ...steps("SRM_PRELAUNCH", wrapper.preLaunch),
    ...steps("SRM_POSTLAUNCH", wrapper.postLaunch),
    ...steps("SRM_POSTEXIT", wrapper.postExit),
    '. "$(dirname "$0")/../srm-launch.sh"',
    "",
  ].join("\n");
}

// Windows PowerShell 5 reads a .ps1 without a byte order mark as the
// system's ANSI code page: titles and paths with accents would break.
// (sh needs LF line endings; a Windows checkout may have CRLF.)
async function writeScript(file: string, content: string) {
  await fs.outputFile(
    file,
    file.endsWith(".ps1")
      ? `\ufeff${content}`
      : content.replace(/\r\n/g, "\n"),
    { encoding: "utf8", mode: 0o755 },
  );
}

// Writes SRM's launch script and the parsers' scripts.
export async function installLaunchScripts() {
  for (const [name, content] of Object.entries(bundledScripts())) {
    await writeScript(path.join(paths.launchWrappersDir, name), content);
  }
}

export async function writeWrapperFile(
  accountId: string,
  shortAppId: string,
  game: WrappedGame,
) {
  await writeScript(wrapperFile(accountId, shortAppId), wrapperFileContent(game));
}

// Wrapped games removed from Steam: their files go. (Files of games that
// were never wrapped don't exist; that's fine.)
export async function removeWrapperFiles(
  accountId: string,
  shortAppIds: string[],
) {
  for (const shortAppId of shortAppIds) {
    for (const os of ["Windows", "Unix"] as WrapperOS[]) {
      await fs.remove(wrapperFile(accountId, shortAppId, os));
    }
  }
}
