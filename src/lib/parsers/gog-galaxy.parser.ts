import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as os from "os";
import * as json from "../helpers/json";
import * as sqlite from "better-sqlite3";

export class GOGParser implements GenericParser {

  private get lang() {
    return APP.lang.gogParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'GOG Galaxy',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'galaxyExeOverride': {
          label: this.lang.galaxyExeOverrideTitle,
          inputType: 'path',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        },
        'gogLauncherMode': {
          label: this.lang.launcherModeInputTitle,
          inputType: 'toggle',
          validationFn: (input: any)=>{ return null },
            info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      let appTitles: string[] = [];
      let appPaths: string[] = [];
      let productIds: string[] = [];
      let dbPath: string = '';
      let galaxyExePath = inputs.galaxyExeOverride || 'C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe';


      if(os.type()=='Windows_NT') {
        dbPath = 'C:\\ProgramData\\GOG.com\\Galaxy\\storage\\galaxy-2.0.db'
      } else {
        reject(this.lang.errors.gogNotCompatible);
      }
      if(!fs.existsSync(dbPath)) {
        reject(this.lang.errors.gogNotInstalled);
      }
      Promise.resolve()
      .then(()=>{
        let db = sqlite(dbPath);
        let details = db.prepare("select * from LimitedDetails").all();
        let playtaskparams = db.prepare("select * from PlayTaskLaunchParameters").all();
        let playtasks = db.prepare("select * from PlayTasks").all();
        db.close();
        playtasks = playtasks.map((x:any) => {
          x.productId = parseInt(x.gameReleaseKey.split('_').pop());
          x.productType = x.gameReleaseKey.split('_')[0]
          return x;
        })
        .filter((x:any) => x.productType == 'gog' && x.isPrimary)
        .map((x:any) => {
          x.params = playtaskparams.filter((y: any) => y.playTaskId==x.id)[0]
          let xdetails = details.filter((y: any) => y.productId==x.productId);
          if(xdetails.length && xdetails[0]) {
            x.title = xdetails[0].title
          }
          return x;
        });
        for(let task of playtasks) {
          if(task.title && task.params.executablePath) {
            appTitles.push(task.title);
            productIds.push(task.productId.toString())
            appPaths.push(task.params.commandLineArgs ? task.params.executablePath+' '+task.params.commandLineArgs : task.params.executablePath)
          }
        }
      })
      .then(()=>{
        let parsedData: ParsedData = {success: [], failed:[]};
        parsedData.executableLocation = galaxyExePath;
        for(let i=0; i < appTitles.length; i++){
          parsedData.success.push({
            extractedTitle: appTitles[i],
            extractedAppId: productIds[i],
            launchOptions: `/command=runGame /gameId=${productIds[i]}`,
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
