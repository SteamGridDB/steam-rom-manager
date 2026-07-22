import { ParserInfo, GenericParser, ParsedData, EpicGameManifest } from "../../models";
import { APP } from "../../variables";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { glob } from "glob";
import * as paths from "../../paths";

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
      try {
        let parsedData: ParsedData = {
          executableLocation: `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
          success: [],
          failed: [],
        };
        const files: string[] = await glob(
          [epicManifestsDir.replace(/\\/g, "/"), "*.item"].join("/"),
        );
        const scriptsPath = path.join(paths.userDataDir, "scripts");
        for (let file of files) {
          if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            let item: EpicGameManifest = JSON.parse(fs.readFileSync(file).toString());
            let launchPath = path.join(
              item.InstallLocation,
              item.LaunchExecutable,
            );
            if (
              item.LaunchExecutable &&
              fs.existsSync(launchPath) &&
              !appTitles.includes(item.DisplayName)
            ) {
              const processName = item.LaunchExecutable.replace(/\.exe$/i, "");
              appTitles.push(item.DisplayName);
              parsedData.success.push({
                extractedTitle: item.DisplayName,
                extractedAppId: item.AppName,
                startInDirectory: scriptsPath,
                launchOptions: `-windowStyle hidden -NoProfile -ExecutionPolicy Bypass -File .\\EpicGamesLauncher.ps1 -gameURI "com.epicgames.launcher://apps/${item.AppName}?action=launch&silent=true" -gameProcessName "${processName}"`,
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
