import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
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
        },
        'eaLauncherMode': {
          label: this.lang.eaLauncherModeTitle,
          inputType: 'toggle',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{

      let appTitles: string[] = [];
      let appNames: string[] = [];
      let appPaths: string[] = [];
      if(os.type()!=='Windows_NT') {
        reject(this.lang.errors.eaNotCompatible);
      }
      let eaInstallDir = inputs.eaGamesDir || "C:\\Program Files (x86)\\EA Games";
      const xmlParser = new XMLParser();
      Promise.resolve()
        .then(()=>{
          let installDataFiles: string[] = glob.sync("*/__Installer/installerdata.xml", { silent: true, dot: true, cwd: eaInstallDir, absolute: true });
          for(let installDataFile of installDataFiles) {
              let gameDir = path.join(path.dirname(installDataFile),'..')
              let xmldata = fs.readFileSync(installDataFile, 'utf-8');
              if(XMLValidator.validate(xmldata)) {
                let parsedData = xmlParser.parse(xmldata);
                let title = ""; let runtimePath=""; let runtime; let contentID; let appID="";
                if(json.caseInsensitiveHasKey(parsedData,["DiPManifest"])) {
                  let gameTitle = json.caseInsensitiveTraverse(parsedData, [["DiPManifest"],["gameTitles"],["gameTitle"]]);
                  if(Array.isArray(gameTitle) && gameTitle.length) {
                    title = String(gameTitle[0])
                  } else {
                    title = String(gameTitle)
                  }
                  runtime = json.caseInsensitiveTraverse(parsedData, [["DiPManifest"],["runtime"],["launcher"]]);
                  contentID = json.caseInsensitiveTraverse(parsedData, [["DiPManifest"],["contentIDs"],["contentID"]])
                } else if(json.caseInsensitiveHasKey(parsedData,["game"])) {
                  let localeInfo = json.caseInsensitiveTraverse(parsedData,[["game"],["metadata"],["localeInfo"]]);
                  if(Array.isArray(localeInfo) && localeInfo.length) {
                    title = String(localeInfo[0].title);
                  } else {
                    title = String(localeInfo.title);
                  }
                  runtime = json.caseInsensitiveTraverse(parsedData,[["game"],["runtime"],["launcher"]])
                  contentID = json.caseInsensitiveTraverse(parsedData,[["game"],["contentIDs"],["contentID"]])
                }
                if(Array.isArray(runtime) && runtime.length) {
                  runtimePath = json.caseInsensitiveTraverse(runtime[0],[["filePath"]]);
                } else if(json.caseInsensitiveHasKey(runtime,["filePath"])) {
                  runtimePath = json.caseInsensitiveTraverse(runtime,[["filePath"]])
                }
                if(Array.isArray(contentID) && contentID.length) {
                  appID = String(contentID[0])
                } else {
                  appID = String(contentID);
                }
                if(title && runtimePath && appID) {
                  appTitles.push(title);
                  appNames.push(appID)
                  appPaths.push(path.join(gameDir,runtimePath.replace(/^\[.*?\]/,'')))
                }

              } else {
                reject(this.lang.errors.invalidXML__i.interpolate({datafile: installDataFile}));
              }
            }
        })
        .then(()=>{
          let parsedData: ParsedData = {
            executableLocation: `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
            success: [],
            failed:[]
          };
          for(let i=0; i < appTitles.length; i++){
            parsedData.success.push({
              extractedTitle: appTitles[i],
              extractedAppId: appNames[i],
              launchOptions: `-windowStyle hidden -NoProfile -ExecutionPolicy Bypass -Command "&Start-Process \\"origin2://game/launch/?offerIds=${appNames[i]}\\""`,
              filePath: appPaths[i]
            });
          }
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
    })
  }
}
