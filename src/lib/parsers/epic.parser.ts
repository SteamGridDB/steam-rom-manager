import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import * as paths from "../../paths";
import { glob } from "glob";

export class EpicParser implements GenericParser {
  private get lang() {
    return APP.lang.epicParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Epic",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        epicManifests: {
          label: this.lang.manifestsInputTitle,
          placeholder: this.lang.manifestsInputPlaceholder[os.type()],
          inputType: "dir",
          info: this.lang.docs__md.input.join(""),
        },
        epicLauncherMode: {
          label: this.lang.launcherModeInputTitle,
          inputType: "toggle",
          info: this.lang.docs__md.input.join(""),
        },
        epicWaitForExit: {
          label: this.lang.waitForExitInputTitle,
          inputType: "toggle",
          hidden: os.type() != "Windows_NT",
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
    return new Promise<ParsedData>(async (resolve, reject) => {
      let appTitles: string[] = [];
      let epicManifestsDir: string = "";
      if (inputs.epicManifests) {
        epicManifestsDir = inputs.epicManifests;
      } else {
        if (os.type() == "Windows_NT") {
          epicManifestsDir =
            "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests";
        } else if (os.type() == "Linux") {
          return reject(this.lang.errors.epicNotCompatible);
        } else if (os.type() == "Darwin") {
          epicManifestsDir = path.join(
            os.homedir(),
            "/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests",
          );
        }
      }
      if (!fs.existsSync(epicManifestsDir)) {
        return reject(this.lang.errors.epicNotInstalled);
      }
      const waitForExit = !!inputs.epicWaitForExit && os.type() == "Windows_NT";
      const scriptPath = path.join(paths.userDataDir, "scripts", "epic.ps1");
      if (waitForExit && !fs.existsSync(scriptPath)) {
        return reject(`epic.ps1 script is missing (expected at ${scriptPath})`);
      }
      const scriptArgs = inputs.epicManifests
        ? ` -manifestsDir "${epicManifestsDir.replace(/[\\/]+$/, "")}"`
        : "";
      try {
        let parsedData: ParsedData = {
          executableLocation: waitForExit
            ? `C:\\Windows\\System32\\conhost.exe`
            : `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
          success: [],
          failed: [],
        };
        const files: string[] = await glob(
          [epicManifestsDir.replace(/\\/g, "/"), "*.item"].join("/"),
        );
        for (let file of files) {
          if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            let item = JSON.parse(fs.readFileSync(file).toString());
            let launchPath = path.join(
              item.InstallLocation,
              item.LaunchExecutable,
            );
            if (
              item.LaunchExecutable &&
              fs.existsSync(launchPath) &&
              !appTitles.includes(item.DisplayName)
            ) {
              appTitles.push(item.DisplayName);
              parsedData.success.push({
                extractedTitle: item.DisplayName,
                extractedAppId: item.AppName,
                launchOptions: waitForExit
                  ? `--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -appName "${item.AppName}"${scriptArgs}`
                  : `-windowStyle hidden -NoProfile -ExecutionPolicy Bypass -Command "&Start-Process \\"com.epicgames.launcher://apps/${item.AppName}?action=launch&silent=true\\""`,
                filePath: launchPath,
                fileLaunchOptions: item.LaunchCommand,
              });
            }
          }
        }
        resolve(parsedData);
      } catch (err) {
        reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
      }
    });
  }
}
