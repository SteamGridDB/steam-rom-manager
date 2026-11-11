// Launch wrappers: a shortcut that runs SRM's launch script, which runs
// scripts around the game (before it starts, once it has started, after it
// exits) and waits for it to exit, so Steam tracks it. See
// lib/launch-wrapper.ts.

// A script run at one stage of a wrapped launch. Failing scripts are logged
// and skipped: the game still starts.
export interface LaunchScript {
  // Path to the script: PowerShell (.ps1; or .bat, .cmd, .exe) on Windows,
  // a shell script elsewhere.
  script: string;
  args?: string[];
  // Seconds: waited after a pre-launch script, before a post-launch or
  // post-exit one.
  delay?: number;
}

export type LaunchStage = "preLaunch" | "postLaunch" | "postExit";

export const launchStages: LaunchStage[] = [
  "preLaunch",
  "postLaunch",
  "postExit",
];

// What a parser adds to a game's launch (e.g. Battle.net restarts its
// launcher first). Parser scripts run inside the user's: after the user's
// pre-launch script, before their post-launch and post-exit ones.
export interface ParserLaunchWrapper {
  // Started instead of the shortcut's own command (e.g. a launcher URL).
  launch?: { file: string; arguments?: string };
  // When the launch hands the game to a launcher: the game is any process
  // running from this folder (or, for processes whose path can't be read,
  // named exeName). Otherwise it's the started process and its children.
  // (Windows only; elsewhere the started process is watched.)
  game?: { folder: string; exeName?: string };
  preLaunch?: LaunchScript[];
  postLaunch?: LaunchScript[];
  postExit?: LaunchScript[];
}

// A game's wrapper: the scripts of each stage in the order they run.
export interface LaunchWrapper {
  // The game's own command: its executable (quoted, with any appended
  // arguments). Its launch options are the app's argumentString.
  target: string;
  launch?: ParserLaunchWrapper["launch"];
  game?: ParserLaunchWrapper["game"];
  preLaunch: LaunchScript[];
  postLaunch: LaunchScript[];
  postExit: LaunchScript[];
}

// The parser setting ("Script wrapper configuration").
export interface ScriptWrapperConfig {
  enabled: boolean;
  preLaunch: { script: string; delay: number };
  postLaunch: { script: string; delay: number };
  postExit: { script: string; delay: number };
}
