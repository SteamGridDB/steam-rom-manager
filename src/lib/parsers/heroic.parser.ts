import { execSync } from "child_process";
import {
  ParserInfo,
  GenericParser,
  ParsedData,
  ParsedSuccess,
} from "../../models";
import { APP } from "../../variables";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

// Heroic Games Launcher stores every store's installed games in plain JSON
// files under its config directory, keyed by store:
//  - GOG:          <config>/gog_store/installed.json
//  - Epic:         <config>/legendaryConfig/legendary/installed.json
//  - Amazon Prime: <config>/nile_store/installed.json
// Launching through Heroic via `heroic --no-gui --no-sandbox "heroic://launch?..."`
// keeps each game's wine/proton settings, so it is the default mode.
export class HeroicParser implements GenericParser {
  private get lang() {
    return APP.lang.heroicParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Heroic",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        heroicExeOverride: {
          label: this.lang.exeOverrideTitle,
          placeholder: this.lang.exeOverridePlaceholder[APP.osType],
          inputType: "path",
          info: this.lang.docs__md.input.join(""),
        },
        heroicAppDataOverride: {
          label: this.lang.appDataOverrideTitle,
          placeholder: this.lang.appDataOverridePlaceholder[APP.osType],
          inputType: "dir",
          info: this.lang.docs__md.input.join(""),
        },
        heroicLauncherMode: {
          label: this.lang.launcherModeInputTitle,
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
  ) {
    return new Promise<ParsedData>((resolve, reject) => {
      try {
        const heroicsAppDataDir =
          inputs.heroicAppDataOverride || this.defaultAppDataDir();
        if (!heroicsAppDataDir || !fs.existsSync(heroicsAppDataDir)) {
          return reject(this.lang.errors.heroicNotInstalled);
        }
        const launcherMode = !!inputs.heroicLauncherMode;
        const heroicExePath = inputs.heroicExeOverride || findOnPath("heroic");
        if (launcherMode && !heroicExePath) {
          return reject(this.lang.errors.heroicExeNotFound);
        }

        const parsedData: ParsedData = {
          executableLocation: launcherMode ? heroicExePath : null,
          success: [],
          failed: [],
        };
        const seen = new Set<string>();

        for (const store of this.stores(heroicsAppDataDir)) {
          for (const game of store.read()) {
            if (seen.has(`${store.runner}:${game.appName}`)) {
              continue;
            }
            seen.add(`${store.runner}:${game.appName}`);
            this.addGame(parsedData, store, game, launcherMode);
          }
        }
        resolve(parsedData);
      } catch (error) {
        reject(this.lang.errors.fatalError__i.interpolate({ error }));
      }
    });
  }

  private defaultAppDataDir(): string {
    switch (os.type()) {
      case "Windows_NT":
        return path.join(String(process.env.APPDATA), "heroic");
      case "Darwin":
        return path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "heroic",
        );
      case "Linux":
        return path.join(os.homedir(), ".config", "heroic");
      default:
        return undefined;
    }
  }

  // One entry per store: how to read its installed.json and how to launch it.
  // A missing file simply means the user has no games from that store.
  private stores(appDataDir: string) {
    return [
      {
        runner: "gog",
        file: path.join(appDataDir, "gog_store", "installed.json"),
        read: () => this.readListFile(appDataDir, "gog_store"),
      },
      {
        runner: "legendary",
        file: path.join(
          appDataDir,
          "legendaryConfig",
          "legendary",
          "installed.json",
        ),
        read: () => this.readMapFile(appDataDir, "legendaryConfig"),
      },
      {
        runner: "nile",
        file: path.join(appDataDir, "nile_store", "installed.json"),
        read: () => this.readListFile(appDataDir, "nile_store"),
      },
    ];
  }

  // gog_store/nile_store shape: { "installed": [ { appName, install_path, ... } ] }
  private readListFile(appDataDir: string, ...segments: string[]) {
    const file = path.join(appDataDir, ...segments, "installed.json");
    if (!fs.existsSync(file)) {
      return [];
    }
    const installed = fs.readJsonSync(file).installed ?? [];
    return Array.isArray(installed) ? installed : [];
  }

  // legendary shape: { "<appName>": { app_name, install_path, ... } }
  private readMapFile(appDataDir: string, ...segments: string[]) {
    const file = path.join(
      appDataDir,
      ...segments,
      "legendary",
      "installed.json",
    );
    if (!fs.existsSync(file)) {
      return [];
    }
    return Object.entries<any>(fs.readJsonSync(file)).map(([key, app]) => ({
      appName: app.app_name ?? key,
      ...app,
    }));
  }

  private addGame(
    parsedData: ParsedData,
    store: { runner: string },
    game: { [key: string]: any },
    launcherMode: boolean,
  ): void {
    const appName: string = game.appName;
    const title: string = game.title || this.gogTitle(game) || appName;
    if (game.is_dlc === true) {
      parsedData.failed.push(`Skipping DLC: ${appName}`);
      return;
    }
    if (!appName || !game.install_path) {
      parsedData.failed.push(
        `Skipping entry without appName or install_path: ${JSON.stringify(title)}`,
      );
      return;
    }

    if (launcherMode) {
      const success: ParsedSuccess = {
        extractedTitle: title,
        launchOptions: `--no-gui --no-sandbox "heroic://launch?appName=${encodeURIComponent(appName)}&runner=${store.runner}"`,
      };
      parsedData.success.push(success);
      return;
    }

    if (!game.executable) {
      parsedData.failed.push(
        `${title}: no executable recorded. Enable "Launch via Heroic" to start it through the launcher.`,
      );
      return;
    }
    parsedData.success.push({
      extractedTitle: title,
      filePath: path.join(game.install_path, game.executable),
      startInDirectory: game.install_path,
    });
  }

  // GOG's installed.json carries no title; the game's install directory has a
  // goggame-<appName>.info file with one.
  private gogTitle(game: { [key: string]: any }): string | undefined {
    const infoPath = path.join(
      game.install_path,
      `goggame-${game.appName}.info`,
    );
    if (fs.existsSync(infoPath)) {
      try {
        return fs.readJsonSync(infoPath).name;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

// A program's full path from PATH, or undefined. (where/which print a line
// break after the name, and where prints every match.)
function findOnPath(program: string): string | undefined {
  const command =
    os.type() == "Windows_NT" ? `where.exe ${program}` : `which ${program}`;
  try {
    return (
      execSync(command, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line) || undefined
    );
  } catch {
    return undefined; // not found
  }
}
