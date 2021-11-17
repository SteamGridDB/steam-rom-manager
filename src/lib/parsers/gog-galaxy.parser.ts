import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as Sentry from '@sentry/electron';
import * as os from "os";
import * as json from "../helpers/json";
import * as sqlite from "better_sqlite3";

export class GOGParser implements GenericParser {

  private get lang() {
    return APP.lang.gogParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'GOG Galaxy',
      info: this.lang.docs__md.self.join(''),
      inputs: {
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

      if(os.type()=='Windows_NT') {
        dbPath = 'C:\\ProgramData\\GOG.com\\Galaxy\\storage\\galaxy-2.0.db'
      } else {
        reject();
      }
      if(!fs.existsSync(dbPath)) {
        reject();
      }
      Promise.resolve()
      .then(()=>{
        let db = sqlite(dbPath);
        console.log(db)
        let installed = db.prepare("select * from InstalledProducts").all().map((x: any) =>x.productId);
        let details = db.prepare("select * from LimitedDetails").all()
        .filter((x:any) => installed.includes(x.productId));
        let playtaskparams = db.prepare("select * from PlayTaskLaunchParameters").all();
        let playtasks = db.prepare("select * from PlayTasks").all();
        db.close();
        console.log('Installed ProductIds: ', installed)
        playtasks = playtasks.map((x:any) => {
          x.productId = parseInt(x.gameReleaseKey.split('_').pop());
          return x;
        })
        .filter((x:any) => installed.includes(x.productId) && x.isPrimary)
        .map((x:any) => {
          x.params = playtaskparams.filter((y: any) => y.playTaskId==x.id)[0]
          x.title = details.filter((y: any) => y.productId==x.productId)[0].title
          return x;
        })
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
        parsedData.executableLocation = 'C:\\Program Files (x86)\\GOG Galaxy\\Galaxy Client.exe'
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
        Sentry.captureException(err);
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }
}
