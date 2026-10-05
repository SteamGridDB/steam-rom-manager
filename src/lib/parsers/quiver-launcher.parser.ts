import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { glob } from "glob";

export class QuiverLauncherParser implements GenericParser {
  private get lang() {
    return APP.lang.quiverLauncherParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Quiver Launcher",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        quiverLauncherDir: {
          label: this.lang.dirInputTitle,
          placeholder: this.lang.dirInputPlaceholder[os.type()],
          inputType: "dir",
          info: this.lang.docs__md.input.join(""),
          required: true,
        },
      },
    };
  }

  execute(
    directories: string[],
    inputs: { [key: string]: any },
    cache?: { [key: string]: any },
  ) {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (os.type() !== "Windows_NT") {
        return reject(this.lang.errors.quiverLauncherNotCompatible);
      }
      const quiverDir: string = inputs.quiverLauncherDir;
      if (!quiverDir) {
        return reject(this.lang.errors.quiverLauncherDirRequired);
      }
      const appsJsonPath = path.join(quiverDir, "apps.json");
      if (!fs.existsSync(appsJsonPath)) {
        return reject(this.lang.errors.quiverLauncherAppsJsonNotFound);
      }
      try {
        const parsedData: ParsedData = { success: [], failed: [] };
        const settingsPath = path.join(quiverDir, "settings.json");
        const settings = fs.existsSync(settingsPath)
          ? fs.readJsonSync(settingsPath)
          : {};
        const appsDir: string =
          settings.AppsPath?.trim() || path.join(quiverDir, "Apps");
        const apps: any[] = fs.readJsonSync(appsJsonPath).apps ?? [];
        for (const app of apps) {
          const appDir: string =
            app.installPath?.trim() ||
            (app.folderName && path.join(appsDir, app.folderName));
          if (!app.name || !appDir) {
            parsedData.failed.push(
              `App entry without name or folder skipped: ${JSON.stringify(app.name ?? app.folderName)}`,
            );
          } else if (!fs.existsSync(appDir)) {
            parsedData.failed.push(
              `${app.name}: not installed (${appDir} does not exist)`,
            );
          } else if (
            fs.existsSync(path.join(appDir, "install-incomplete.txt"))
          ) {
            parsedData.failed.push(
              `${app.name}: installation is incomplete in ${appDir}`,
            );
          } else {
            const executables = await this.findExecutables(appDir);
            if (executables.length === 1) {
              parsedData.success.push({
                extractedTitle: app.name,
                filePath: executables[0],
              });
            } else if (executables.length === 0) {
              parsedData.failed.push(
                `${app.name}: no executable found in ${appDir}`,
              );
            } else {
              parsedData.failed.push(
                `${app.name}: several executables found in ${appDir}, launch it once from Quiver Launcher to choose one`,
              );
            }
          }
        }
        resolve(parsedData);
      } catch (err) {
        reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
      }
    });
  }

  // Same lookup order as Quiver: saved choice, then top-level, then recursive.
  // Like Quiver, several candidates without a saved choice are not guessed.
  private async findExecutables(appDir: string): Promise<string[]> {
    const selectedFile = path.join(appDir, "selected_executable.txt");
    if (fs.existsSync(selectedFile)) {
      const selected = path.resolve(
        appDir,
        fs.readFileSync(selectedFile, "utf8").trim(),
      );
      if (fs.statSync(selected, { throwIfNoEntry: false })?.isFile()) {
        return [selected];
      }
    }
    const options = { cwd: appDir, nocase: true, absolute: true };
    const topLevel = await glob("*.{exe,bat,cmd}", options);
    return topLevel.length ? topLevel : glob("**/*.{exe,bat,cmd}", options);
  }
}
