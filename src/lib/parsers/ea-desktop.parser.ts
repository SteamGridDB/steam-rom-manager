import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { glob } from "glob";
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
          placeholder: this.lang.eaGamesDirPlaceholder,
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
    return new Promise<ParsedData>(async (resolve,reject)=>{

      if(os.type()!=='Windows_NT') {
        return reject(this.lang.errors.eaNotCompatible);
      }
      try{ 
      let eaInstallDir = inputs.eaGamesDir || "C:\\Program Files (x86)\\EA Games";
      const xmlParser = new XMLParser();
      let installDataFiles: string[] = await glob("*/__Installer/installerdata.xml", { dot: true, cwd: eaInstallDir, absolute: true });
      let finalData: ParsedData = {
        executableLocation: `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
        success: [],
        failed:[]
      };
      for(let installDataFile of installDataFiles) {
        let gameDir = path.join(path.dirname(installDataFile),'..')
        let xmldata = fs.readFileSync(installDataFile, 'utf-8');
        if(XMLValidator.validate(xmldata)) {
          let parsedData = xmlParser.parse(xmldata);
          let title = ""; let runtimePath=""; let runtime; let contentID; let appID=""; let commandArgs;
          if(json.caselessHas(parsedData,[["DiPManifest"]])) {
            let gameTitle = json.caselessGet(parsedData, [["DiPManifest"],["gameTitles"],["gameTitle"]]);
            if(Array.isArray(gameTitle) && gameTitle.length) {
              title = String(gameTitle[0])
            } else {
              title = String(gameTitle)
            }
            runtime = json.caselessGet(parsedData, [["DiPManifest"],["runtime"],["launcher"]], true);
            contentID = json.caselessGet(parsedData, [["DiPManifest"],["contentIDs"],["contentID"]])
          } else if(json.caselessHas(parsedData,[["game"]])) {
            let localeInfo = json.caselessGet(parsedData,[["game"],["metadata"],["localeInfo"]]);
            if(Array.isArray(localeInfo) && localeInfo.length) {
              title = String(localeInfo[0].title);
            } else {
              title = String(localeInfo.title);
            }
            runtime = json.caselessGet(parsedData, [["game"],["runtime"],["launcher"]], true)
            contentID = json.caselessGet(parsedData, [["game"],["contentIDs"],["contentID"]])
          }
          if(runtime && Array.isArray(runtime) && runtime.length) {
            runtimePath = json.caselessGet(runtime[0],[["filePath"]]);
            commandArgs = json.caselessGet(runtime[0],[["parameters"]])
          } else if(json.caselessHas(runtime,[["filePath"]])) {
            runtimePath = json.caselessGet(runtime,[["filePath"]])
            commandArgs = json.caselessGet(runtime,[["parameters"]])
          }
          if(Array.isArray(contentID) && contentID.length) {
            appID = String(contentID[0])
          } else {
            appID = String(contentID);
          }
          if(title && appID && runtimePath) {
            finalData.success.push({
              extractedTitle: title,
              extractedAppId: appID,
              launchOptions: `-windowStyle hidden -NoProfile -ExecutionPolicy Bypass -Command "&Start-Process \\"origin2://game/launch/?offerIds=${appID}\\""`,
              filePath: path.join(gameDir,runtimePath.replace(/^\[.*?\]/,'')),
              fileLaunchOptions: commandArgs
            })
          }
        }
      }
      resolve(finalData);
      } catch(err) {
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      };
    })
  }
}
