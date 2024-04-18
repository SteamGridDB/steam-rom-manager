import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import { stat } from 'original-fs';

export class ManualParser implements GenericParser {

  private get lang() {
    return APP.lang.manualParser;
  }
  getParserInfo(): ParserInfo {
      return {
          title: 'Manual',
          info: this.lang.docs__md.self.join(''),
          inputs: {
              'manualManifests': {
                  label: this.lang.manifestsInputTitle,
                  placeholder: this.lang.manifestsInputPlaceholder,
                  inputType: 'dir',
                  validationFn: null,
                  info: this.lang.docs__md.input.join('')
              }
          }
      };
  }

    execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
        let directory = directories[0];
        let parsedData: ParsedData = { success: [], failed: [] };
        return Promise.resolve().then(() => {
            let files = fs.readdirSync(directory);
            for (let i = 0; i < files.length; i++) {
                if (path.extname(files[i]).toLowerCase() === ".json") {
                    let filePath = path.join(directory, files[i]);
                    try {
                        let jsonObj = fs.readJsonSync(filePath)
                        let keys = Object.keys(jsonObj)
                        if(typeof(jsonObj[keys[0]]) === 'string') {
                          parsedData.success.push({ 
                            extractedTitle: jsonObj.title, 
                            filePath: jsonObj.target, startInDirectory: jsonObj.startIn, 
                            launchOptions: jsonObj.launchOptions, 
                            appendArgsToExecutable: !!jsonObj.appendArgsToExecutable
                          });
                        } else if(typeof(jsonObj[keys[0]]) === 'object') {
                          for(let j = 0; j < keys.length; j++) {
                            parsedData.success.push({
                              extractedTitle: jsonObj[keys[j]].title,
                              filePath: jsonObj[keys[j]].target,
                              startInDirectory: jsonObj[keys[j]].startIn,
                              launchOptions: jsonObj[keys[j]].launchOptions,
                              appendArgsToExecutable: !!jsonObj[keys[j]].appendArgsToExecutable
                            })
                          }
                        }
                    }
                    catch (err) {
                      parsedData.failed.push(filePath);
                    }
                }
            }
            return parsedData;
        }).catch((err) => {
            return undefined;
        });
  }
}
