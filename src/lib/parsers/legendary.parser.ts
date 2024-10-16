import { execSync } from "child_process";
import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

export class LegendaryParser implements GenericParser {
  private get lang() {
    return APP.lang.legendaryParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Legendary",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        legendaryExeOverride: {
          label: this.lang.legendaryExeOverrideTitle,
          placeholder: this.lang.legendaryExeOverridePlaceholder[os.type()],
          inputType: "path",
          info: this.lang.docs__md.input.join(""),
        },
        legendaryInstalledFile: {
          label: this.lang.legendaryInstalledFileTitle,
          placeholder: this.lang.legendaryInstalledFilePlaceholder[os.type()],
          inputType: "path",
          info: this.lang.docs__md.input.join(""),
        },
        legendaryLauncherMode: {
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
      let legendaryInstalledFile: string;
      if (inputs.legendaryInstalledFile) {
        legendaryInstalledFile = inputs.legendaryInstalledFile;
      } else {
        legendaryInstalledFile = path.join(
          os.homedir(),
          ".config/legendary/installed.json",
        );
      }
      let legendaryExePath: string;
      if (inputs.legendaryExeOverride) {
        legendaryExePath = inputs.legendaryExeOverride;
      } else if (os.type() == "Windows_NT") {
        legendaryExePath = execSync("(Get-Command legendary).Path", {
          shell: "pwsh",
          encoding: "utf-8",
        });
      } else {
        legendaryExePath = execSync("which legendary", { encoding: "utf-8" });
      }
      if (!fs.existsSync(legendaryInstalledFile) || !legendaryExePath) {
        return reject(this.lang.errors.legendaryNotInstalled);
      }
      let installed = JSON.parse(
        fs.readFileSync(legendaryInstalledFile, "utf-8"),
      );
      let parsedData: ParsedData = {
        executableLocation: legendaryExePath,
        success: [],
        failed: [],
      };
      for (const app_name in installed) {
        const app = installed[app_name];
        if (app.is_dlc === true) {
          parsedData.failed.push(`Skipping DLC: ${app_name}`);
        } else if (!app.executable) {
          parsedData.failed.push(
            `Skipping app with missing executable: ${app_name}`,
          );
        } else {
          parsedData.success.push({
            extractedTitle: app.title,
            extractedAppId: app.app_name,
            launchOptions: `launch ${app.app_name}`,
            filePath: path.join(app.install_path, app.executable),
            fileLaunchOptions: app.launch_parameters,
          });
        }
      }
      resolve(parsedData);
    });
  }
}
