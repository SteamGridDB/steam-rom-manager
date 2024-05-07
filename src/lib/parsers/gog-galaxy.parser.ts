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
          placeholder: this.lang.galaxyExeOverridePlaceholder,
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
      let dbPath: string = '';
      let galaxyExePath = inputs.galaxyExeOverride || 'C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe';

      if(os.type()=='Windows_NT') {
        dbPath = 'C:\\ProgramData\\GOG.com\\Galaxy\\storage\\galaxy-2.0.db'
      } else {
        return reject(this.lang.errors.gogNotCompatible);
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
            parsedData.success.push({
              extractedTitle: task.title || path.dirname(task.params.executablePath).split(path.sep).pop(),
              extractedAppId: productID,
              launchOptions: `/command=runGame /gameId=${productID}`,
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