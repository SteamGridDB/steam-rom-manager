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
        },
        'parseRegistryEntries': {
          label: this.lang.parseRegistryEntries,
          inputType: 'toggle',
          hidden: os.type()!='Windows_NT',
          validationFn: (input: any) => { return null },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  private processRegKey(regkey: Registry.Registry){
    return new Promise<{success: ParsedSuccess, failMessage: string}>((resolve, reject) => {
      regkey.values((err: Error, values: Registry.RegistryItem[]) => {
        if (err) {
          return reject(err);
        }
        if (values) {
          const transformed = Object.fromEntries(values.filter(entry => entry.name && entry.value)
            .map(entry=>[entry.name, entry.value]));
          if(transformed.gameName && transformed.gameID && transformed.launchCommand && transformed.workingDir) {
            if(transformed.dependsOn) { // ignore DLC
              resolve({success: null, failMessage: `Skipping DLC: ${transformed.gameName}`})
            } else {
              if(!fs.existsSync(transformed.launchCommand)) {
                return resolve({success: null, failMessage: `Skipping Missing Executable: ${transformed.gameName}`})
              }
              return resolve({success: {
                extractedTitle: transformed.gameName,
                extractedAppId: transformed.gameID,
                launchOptions: `/command=runGame /gameId=${transformed.gameID}`,
                filePath: transformed.launchCommand,
                fileLaunchOptions: transformed.launchParam,
                startInDirectory: transformed.workingDir
              }, failMessage: null})
            }
          } else {
            resolve(null)
          }
        }
      });
    });
  }

  private getRegInstalled(executableLocation: string){
    return new Promise<ParsedData>((resolve, reject) => {
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
            let parsedData: ParsedData = {
              executableLocation: executableLocation,
              success: parsedArray.filter(x=> x&&!x.failMessage).map(x=>x.success),
              failed: parsedArray.filter(x=>x&&x.failMessage).map(x=>x.failMessage)
            }
            return resolve(parsedData);
          }).catch((err) => {
            return reject(err)
          });
        } else {
          return resolve( {success: [], failed: [] });
        }
      });
    });
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
      if(inputs.parseRegistryEntries && os.type()=='Windows_NT'){
        this.getRegInstalled(galaxyExePath).then((parsedData) => {
          parsedData.executableLocation = galaxyExePath;
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
      }
    });
  }
}