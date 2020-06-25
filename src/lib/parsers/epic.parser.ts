import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as os from "os";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as glob from "glob";
import * as Sentry from '@sentry/electron';

export class EpicParser implements GenericParser {

  private get lang() {
    return APP.lang.epicParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Epic',
      info: this.lang.docs__md.self.join(''),
      inputs: {}
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{

      let appTitles: string[] = [];
      let appPaths: string[] = [];
      let epicManifestsDir: string = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';
      if( os.type()=='Linux' ) {
        reject(this.lang.errors.epicNotCompatible)
      } else if( os.type()=='Darwin' ){
        epicManifestsDir = path.join(os.homedir(),'/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests');
      }
      if(!fs.existsSync(epicManifestsDir)){
        reject(this.lang.errors.epicNotInstalled)
      }
      Promise.resolve()
        .then(()=>{
          glob(epicManifestsDir+'*.item',(err,files)=>{
            for(const file in files){
              let item = JSON.parse(fs.readFileSync(file).toString())
              appTitles.push(item.DisplayName);
              appPaths.push(path.join(item.InstallLocation,item.LaunchExecutable))
            }
          });
        })
        .then(()=>{
          let parsedData: ParsedData = {success: [], failed:[]};
          for(let i=0;i<appTitles.length; i++){
            parsedData.success.push({extractedTitle: appTitles[i], filePath: appPaths[i]});
          }
          resolve(parsedData);
        }).catch((err)=>{
          Sentry.captureException(err);
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
    })
  }
}
