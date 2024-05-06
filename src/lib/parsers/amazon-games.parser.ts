import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from 'path';
import { parse } from 'yaml';
import { SqliteWrapper } from '../helpers/sqlite';

export class AmazonGamesParser implements GenericParser {

  private get lang() {
    return APP.lang.amazonGamesParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Amazon Games',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'amazonGamesExeOverride': {
          label: this.lang.exeOverrideTitle,
          placeholder: this.lang.exeOverridePlaceholder,
          inputType: 'dir',
          validationFn: (input: string) => {
            if(!input || fs.existsSync(input) && fs.lstatSync(input).isFile()) {
              return null;
            } else {
              return this.lang.errors.invalidExeOverride;
            }
          },
          info: this.lang.docs__md.input.join('')
        },
        'amazonGamesLauncherMode': {
          label: this.lang.launcherModeInputTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
            info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      try {
        if(os.type()!='Windows_NT') {
          return reject(this.lang.errors.osUnsupported);
        }

        const launcherMode = inputs.amazonGamesLauncherMode;

        const amazonGamesExe = inputs.amazonGamesExeOverride || path.resolve(`${process.env.APPDATA}\\..\\local\\Amazon Games\\App\\Amazon Games.exe`);
        const dbPath = path.resolve(`${path.dirname(amazonGamesExe)}\\..\\Data\\Games\\Sql\\GameInstallInfo.sqlite`);

        if(!fs.existsSync(dbPath)) {
          return reject(this.lang.errors.databaseNotFound);
        }
        const sqliteWrapper = new SqliteWrapper('amazon-games', dbPath);
        sqliteWrapper.callWorker().then((games: {[k: string]: any}[]) => {
          const success = games.filter(({ InstallDirectory, Installed }:{ [key:string]:string }) => {
            return (fs.existsSync(`${InstallDirectory}\\fuel.json`) || launcherMode) && Installed;
          })
          .map(({ ProductTitle, InstallDirectory, Installed, Id }: { [key:string]:string }) => {
            if (launcherMode) {
              return {
                extractedTitle: ProductTitle,
                startInDirectory: InstallDirectory,
                launchOptions: `amazon-games://play/${Id}`,
              };
            }

            const fuelJson = fs.readFileSync(`${InstallDirectory}\\fuel.json`);
            // not really json so need to parse with yaml parser
            const { Main: { Command, Args } } = parse(fuelJson.toString());
            return {
              extractedTitle: ProductTitle,
              startInDirectory: InstallDirectory,
              filePath: `${InstallDirectory}\\${Command}`,
              fileLaunchOptions: Args?.join(' '),
            };
          });

          resolve({executableLocation: launcherMode ? amazonGamesExe : null, success: success, failed:[]});

        }).catch((error)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: error}))
        })

      } catch(error) {
        reject(this.lang.errors.fatalError__i.interpolate({error: error}));
      }
    })
  }
}
