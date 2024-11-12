import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

export class ManualParser implements GenericParser {
  private get lang() {
    return APP.lang.manualParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Manual",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        manualManifests: {
          label: this.lang.manifestsInputTitle,
          placeholder: this.lang.manifestsInputPlaceholder[os.type()],
          required: true,
          inputType: "dir",
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
    let directory = directories[0];
    let parsedData: ParsedData = { success: [], failed: [] };
    return Promise.resolve()
      .then(() => {
        let files = fs.readdirSync(directory);
        for (let i = 0; i < files.length; i++) {
          if (path.extname(files[i]).toLowerCase() === ".json") {
            let filePath = path.join(directory, files[i]);
            try {
              let jsonObj = fs.readJsonSync(filePath);
              let jsonObjs = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
              for (let j = 0; j < jsonObjs.length; j++) {
                parsedData.success.push({
                  extractedTitle: jsonObjs[j].title,
                  filePath: jsonObjs[j].target,
                  startInDirectory: jsonObjs[j].startIn,
                  launchOptions: jsonObjs[j].launchOptions,
                  appendArgsToExecutable:
                    !!jsonObjs[j].appendArgsToExecutable,
                });
              }
            } catch (err) {
              parsedData.failed.push(filePath);
            }
          }
        }
        return parsedData;
      })
      .catch((err) => {
        return undefined;
      });
  }
}
