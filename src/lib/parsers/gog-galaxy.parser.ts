import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { SqliteWrapper } from "../helpers/sqlite";

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
          placeholder: os.type()=='Windows_NT' ? this.lang.galaxyExeOverridePlaceholderWin : this.lang.galaxyExeOverridePlaceholderMac,
          inputType: 'path',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        },
        'gogLauncherMode': {
          label: this.lang.launcherModeInputTitle,
          inputType: 'toggle',
          validationFn: (input: any)=>{ return null },
          info: this.lang.docs__md.input.join('')
        },
        'parseLinkedExecs': {
          label: this.lang.parseLinkedExecsTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>(async (resolve,reject)=>{
      let dbPath, galaxyExePath: string;
      if(os.type()=='Windows_NT') {
        dbPath = 'C:\\ProgramData\\GOG.com\\Galaxy\\storage\\galaxy-2.0.db';
        galaxyExePath = 'C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe';
      } else if(os.type()=='Darwin') {
        dbPath = '/Users/Shared/GOG.com/Galaxy/Storage/galaxy-2.0.db';
        galaxyExePath = '/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy';
      } else {
        return reject(this.lang.errors.gogNotCompatible);
      }
      if(inputs.galaxyExeOverride) {
        galaxyExePath = inputs.galaxyExeOverride
      }
      if(!fs.existsSync(dbPath)) {
        return reject(this.lang.errors.gogNotInstalled);
      }
      try {
        const sqliteWrapper = new SqliteWrapper('gog-galaxy', dbPath, {externals: !!inputs.parseLinkedExecs});
        const playtasks = await sqliteWrapper.callWorker() as any[];
        let parsedData: ParsedData = {success: [], failed:[]};
        parsedData.executableLocation = galaxyExePath;
        for(let task of playtasks) {
          if(task.params.executablePath) {
            const productID = task.productId.toString();
            const flag = os.type() == 'Windows_NT' ? '/' : '--';
            let fallbackTitle;
            if(os.type() == 'Windows_NT') {
              fallbackTitle = path.dirname(task.params.executablePath).split(path.sep).pop();
            } else {
              fallbackTitle = task.params.executablePath.split(path.sep).pop().slice().replace(/\.[^.]*$/, '');
            }
            parsedData.success.push({
              extractedTitle: task.title || fallbackTitle,
              extractedAppId: productID,
              launchOptions: `${flag}command=runGame ${flag}gameId=${productID}`,
              filePath: task.params.executablePath,
              fileLaunchOptions: task.params.commandLineArgs
            })
          }
        }
        resolve(parsedData);
      }
      catch(err) {
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      };
    });
  }
}