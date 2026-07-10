import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { glob } from "glob";

export class GithubLauncherParser implements GenericParser {
  private get lang() {
    return APP.lang.githubLauncherParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "GitHub Launcher",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        githubLauncherDir: {
          label: this.lang.dirInputTitle,
          placeholder: this.lang.dirInputPlaceholder[os.type()],
          inputType: "dir",
          info: this.lang.docs__md.input.join(""),
          required: true
        }
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
        return reject(this.lang.errors.githubLauncherNotCompatible)
      }
      if(!inputs.githubLauncherDir) {
        return reject(this.lang.errors.githubLauncherDirRequired)
      }
      if(!fs.existsSync(inputs.githubLauncherDir)) {
        return reject(this.lang.errors.githubLauncherNotInstalled)
      }
      let parsedData: ParsedData = {
        executableLocation: null,
        success: [],
        failed: []
      }
      let settingsConfigPath = path.join(inputs.githubLauncherDir, "settings.json");
      let appsConfigPath = path.join(inputs.githubLauncherDir, "apps.json");
      try {
        let settings = fs.readJsonSync(settingsConfigPath);
        let apps = fs.readJsonSync(appsConfigPath);
        let gamesDir = settings?.AppsPath;
        if(!gamesDir || !fs.existsSync(gamesDir)) { throw `Invalid games directory ${gamesDir}` }
        let gamesList: any[] = apps.apps;
        for(let game of gamesList) {
          let gameDir = path.join(gamesDir, game.folderName)
          if(game.name && game.folderName && fs.existsSync(gameDir)) {
            const exeFileNames = await glob("*.exe", { dot: true, cwd: gameDir, nocase: true })
            if(!exeFileNames.length) {
              parsedData.failed.push(`Game folder ${gameDir} has no executable file`)
            } else {
              let chosenExeFile: string;
              if (exeFileNames.length == 1) {
                chosenExeFile = exeFileNames[0]
              } else {
                chosenExeFile = (
                  await Promise.all(
                    exeFileNames.map(async (name) => {
                      const fullPath = path.join(gameDir, name)
                      const stat = await fs.promises.stat(fullPath)
                      return { name, size: stat.size }
                    })
                  )
                )
                .sort((a, b) => b.size - a.size) // largest first — usually the real game exe, not an uninstaller/redist
                .map((f) => f.name)[0]
              }
              parsedData.success.push({
                extractedTitle: game.name,
                filePath: path.join(gameDir, chosenExeFile)
              })
            }
          } else {
            parsedData.failed.push(`Game folder ${gameDir} does not exist`)
          }
        }

        resolve(parsedData);
      } catch(err) {
        reject(this.lang.errors.fatalError__i.interpolate({ error: err }));
      }
    })
  }
}
