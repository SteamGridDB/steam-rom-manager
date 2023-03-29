import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as glob from "glob";
import * as json from "../helpers/json";
import { XMLParser, XMLValidator} from "fast-xml-parser";

export class EADesktopParser implements GenericParser {

  private get lang() {
    return APP.lang.eaDesktopParser;
  }

  getParserInfo(): ParserInfo {
    return {
      title: 'EA Desktop',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'eaGamesDir': {
          label: this.lang.eaGamesDirTitle,
          inputType: 'dir',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{

      let appTitles: string[] = [];
      let appPaths: string[] = [];
      let eaInstallDir = inputs.eaGamesDir || "C:\\Program Files (x86)\\EA Games";
      const xmlParser = new XMLParser();
      Promise.resolve()
        .then(()=>{
          glob("*/__Installer/installerdata.xml", { silent: true, dot: true, cwd: eaInstallDir, absolute: true }, (error: Error, installDataFiles: string[])=>{
            for(let installDataFile of installDataFiles) {

              let gameDir = path.join(path.dirname(installDataFile),'..')
              let xmldata = fs.readFileSync(installDataFile, 'utf-8');
              if(XMLValidator.validate(xmldata)) {
                let parsedData = xmlParser.parse(xmldata);
                let title = ""; let runtimePath=""; let runtime;
                if(json.caseInsensitiveHasKey(parsedData,["DiPManifest"])) {
                  let gameTitle = json.caseInsensitiveTraverse(parsedData, [["DiPManifest"],["gameTitles"],["gameTitle"]]);
                  if(Array.isArray(gameTitle) && gameTitle.length) {
                    title = gameTitle[0]
                  } else {
                    title = String(gameTitle)
                  }
                  runtime = json.caseInsensitiveTraverse(parsedData, [["DiPManifest"],["runtime"],["launcher"]]);
                } else if(json.caseInsensitiveHasKey(parsedData,["game"])) {
                  let localeInfo = json.caseInsensitiveTraverse(parsedData,[["game"],["metadata"],["localeInfo"]]);
                  if(Array.isArray(localeInfo) && localeInfo.length) {
                    title = localeInfo[0].title;
                  } else {
                    title = String(localeInfo.title);
                  }
                  runtime = json.caseInsensitiveTraverse(parsedData,[["game"],["runtime"],["launcher"]])
                }
                if(Array.isArray(runtime) && runtime.length) {
                  runtimePath = json.caseInsensitiveTraverse(runtime[0],[["filePath"]]);
                } else if(json.caseInsensitiveHasKey(runtime,["filePath"])) {
                  runtimePath = json.caseInsensitiveTraverse(runtime,[["filePath"]])
                }
                if(title && runtimePath) {
                  console.log(title)
                  console.log(path.join(gameDir,runtimePath.replace(/^\[.*?\]/,'')))

                  appTitles.push(title);
                  appPaths.push(path.join(gameDir,runtimePath.replace(/^\[.*?\]/,'')))
                }

              } else {
                reject(this.lang.errors.invalidXML__i.interpolate({datafile: installDataFile}));
              }
            }
          })
        })
        .then(()=>{
          console.log(appTitles)
          console.log(appPaths)
          let parsedData: ParsedData = {success: [], failed:[]};
          for(let i=0;i<appTitles.length; i++){
            parsedData.success.push({extractedTitle: appTitles[i], filePath: appPaths[i]});
          }
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
    })
  }
}
