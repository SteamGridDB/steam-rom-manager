import { ParserInfo, GenericParser, ParsedData, ParsedSuccess } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { SqliteWrapper } from "../helpers/sqlite";
import Registry from "winreg";

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
        },
        'parseRegistryEntries': {
          label: this.lang.parseRegistryEntries,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  private processRegKey(regkey: Registry.Registry){
    return new Promise<ParsedSuccess>((resolve, reject) => {
      regkey.values((err: Error, values: Registry.RegistryItem[]) => {
        if (err) {
          return reject(err);
        }
        if (values) {
          const productID = values.find((entry) => entry.name === 'gameID').value;
          let entry: ParsedSuccess = {
            extractedTitle: values.find((entry) => entry.name === 'gameName').value,
            extractedAppId: productID,
            launchOptions: `/command=runGame /gameId=${productID}`,
            filePath: values.find((entry) => entry.name === 'launchCommand').value,
            fileLaunchOptions: (values.find((entry) => entry.name === 'launchParam') ?? {value: ''}).value,
            startInDirectory: values.find((entry) => entry.name === 'workingDir').value
          }
          return resolve(entry);
        }
      });
    });
  }

  private getRegInstalled(){
    return new Promise<ParsedSuccess[]>((resolve, reject) => {
      const rootkey: string = "\\SOFTWARE\\WOW6432Node\\GOG.com\\Games"
      const reg = new Registry({
        hive: Registry.HKLM,
        key: rootkey,
      });
      
      reg.keys((err: Error, regkeys: Registry.Registry[]) => {
        if (err) {
          return reject(err);
        }
        if (regkeys) {
          const promiseArr = regkeys.map((regkey) => this.processRegKey(regkey))
          Promise.all(promiseArr).then((parsedArray) => {
            return resolve(parsedArray);
          }).catch((err) => {
            return reject(err)
          });
        } else {
          return resolve([]);
        }
      });
    });
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
      if(inputs.parseRegistryEntries){
        this.getRegInstalled().then((games) => {
          let parsedData: ParsedData = { success: [], failed: [] };
          parsedData.executableLocation = galaxyExePath;
          parsedData.success = games;
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
      } else {
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
      }
    });
  }
}