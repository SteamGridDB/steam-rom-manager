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
            const chosen =
              executables.length === 1
                ? executables[0]
                : this.guessExecutable(executables, [
                    app.folderName,
                    app.project,
                    app.repository?.split("/").pop(),
                    app.name,
                  ]);
            if (chosen) {
              parsedData.success.push({
                extractedTitle: app.name,
                filePath: chosen,
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

  // Quiver asks the user when there are several candidates and no saved
  // choice. Rather than skip the app, drop obvious helpers/installers and pick
  // the candidate named after the app (e.g. dusklight.exe over
  // crashpad_handler.exe). Returns undefined when there is no confident pick.
  private guessExecutable(
    executables: string[],
    identities: (string | undefined)[],
  ): string | undefined {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const stem = (file: string) =>
      normalize(path.basename(file, path.extname(file)));
    const helper =
      /crash|unins|setup|install|redist|elevate|update|settings|config|extract|helper/;
    const candidates = executables.filter(
      (file) => !helper.test(path.basename(file).toLowerCase()),
    );
    if (candidates.length === 1) {
      return candidates[0];
    }
    const ids = identities
      .filter((id) => !!id)
      .map(normalize)
      .filter((id) => id.length >= 3);
    const matches = candidates.filter((file) => {
      const name = stem(file);
      return (
        name.length >= 3 &&
        ids.some((id) => id.includes(name) || name.includes(id))
      );
    });
    // Prefer real executables over .bat/.cmd scripts, keeping Quiver's order.
    return (
      matches.find((file) => path.extname(file).toLowerCase() === ".exe") ??
      matches[0]
    );
  }

  // Same lookup order as Quiver: saved choice, then top-level, then recursive.
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
