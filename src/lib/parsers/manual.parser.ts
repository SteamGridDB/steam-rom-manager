import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as Sentry from '@sentry/electron';
import { stat } from 'original-fs';

export class ManualPraser implements GenericParser {

  private get lang() {
    return APP.lang.manualPraser;
  }
  getParserInfo(): ParserInfo {
      return {
          title: 'Manual',
          info: this.lang.docs__md.self.join(''),
          inputs: {
              'manifests': {
                  label: this.lang.manifestsInputTitle,
                  inputType: 'dir',
                  validationFn: (input: string) => {
                      if (fs.existsSync(input) && fs.lstatSync(input).isDirectory()) {
                          return null;
                      } else {
                          return this.lang.errors.invalidManifestsOverride;
                      }
                  },
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
                        parsedData.success.push({ extractedTitle: jsonObj.title, filePath: jsonObj.target, startInDirectory: jsonObj.startIn, launchOptions: jsonObj.launchOptions });
                    }
                    catch (err) {
                        Sentry.captureException(err);
                        parsedData.failed.push(filePath);
                    }
                }
            }
            return parsedData;
        }).catch((err) => {
            Sentry.captureException(err);
            return undefined;
        });
  }
}
