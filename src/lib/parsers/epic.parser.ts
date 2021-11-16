import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as os from "os";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import { globPromise } from "../helpers/glob/promise"
import * as Sentry from '@sentry/electron';


export class EpicParser implements GenericParser {

  private get lang() {
    return APP.lang.epicParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Epic',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'manifests': {
          label: this.lang.inputTitle,
          validationFn: (input: string)=>{
            if(!input || fs.existsSync(input) && fs.lstatSync(input).isDirectory()) {
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
    return new Promise<ParsedData>((resolve,reject)=>{

      let appTitles: string[] = [];
      let appPaths: string[] = [];
      let appNames: string[] = [];
      let epicManifestsDir: string = "";
      if(inputs.manifests) {
        epicManifestsDir = inputs.manifests
      } else {
        if(os.type()=='Windows_NT') {
          epicManifestsDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';
        } else if(os.type()=='Linux') {
          reject(this.lang.errors.epicNotCompatible)
        } else if( os.type()=='Darwin' ) {
          epicManifestsDir = path.join(os.homedir(),'/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests');
        }
      }
      if(!fs.existsSync(epicManifestsDir)) {
        reject(this.lang.errors.epicNotInstalled)
      }
      let chain: Promise<any> = Promise.resolve()
      .then(()=>{
        return globPromise([epicManifestsDir.replace(/\\/g,'/'),'*.item'].join('/'));
      })
      .then((files: string[])=>{
        files.forEach((file)=>{
          if(fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            let item = JSON.parse(fs.readFileSync(file).toString())
            let launchPath = path.join(item.InstallLocation,item.LaunchExecutable);
            if(item.LaunchExecutable && fs.existsSync(launchPath) && !appTitles.includes(item.DisplayName)) {
              appTitles.push(item.DisplayName);
              appNames.push(item.AppName);
              appPaths.push(launchPath)
            }
          }
        })
      })
      .then(()=>{
        let parsedData: ParsedData = {success: [], failed:[]};
        for(let i=0;i < appTitles.length; i++){
          parsedData.success.push({extractedTitle: appTitles[i], extractedAppId: appNames[i] , filePath: appPaths[i]});
        }
        resolve(parsedData);
      }).catch((err)=>{
        Sentry.captureException(err);
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }
}
