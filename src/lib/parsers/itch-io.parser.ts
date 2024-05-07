import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { SqliteWrapper } from '../helpers/sqlite';

export class ItchIoParser implements GenericParser {

  private get lang() {
    return APP.lang.itchIoParser;
  }

  getParserInfo(): ParserInfo {
    return {
      title: 'itch.io',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'itchIoAppDataOverride': {
          label: this.lang.itchIoAppDataOverrideTitle,
          placeholder: this.lang.itchIoAppDataOverridePlaceholder,
          inputType: 'dir',
          validationFn: (input: string) => {
            if(!input || fs.existsSync(input) && !fs.lstatSync(input).isFile()) {
              return null;
            } else {
              return this.lang.errors.invalidItchIoAppDataOverride;
            }
          },
          info: this.lang.docs__md.input.join('')
        },
        'itchIoWindowsOnLinuxInstallDriveRedirect': {
          label: this.lang.itchIoWindowsOnLinuxInstallDriveRedirectTitle,
          placeholder: this.lang.itchIoWindowsOnLinuxInstallDriveRedirectPlaceholder,
          inputType: 'dir',
          validationFn: (input: string) => {
            if(!input || fs.existsSync(input) && fs.lstatSync(input).isDirectory()) {
              return null;
            } else {
              return this.lang.errors.invalidItchIoWindowsOnLinuxInstallDriveRedirect;
            }
          },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      try {
        if(!["Windows_NT", "Linux", "Darwin"].includes(os.type())) {
          return reject(this.lang.errors.osUnsupported);
        }

        const itchIoAppDataDir = inputs.itchIoAppDataOverride || (() => {
          switch(os.type()) {
            case "Windows_NT":
              return `${process.env.APPDATA}\\itch`;
            case "Linux":
              return `${os.homedir()}/.config/itch`;
            case "Darwin":
              return `${os.homedir()}/Library/Application Support/itch`;
          }
        })();
        const dbPath = path.join(itchIoAppDataDir,'/db/butler.db');
        if(!fs.existsSync(dbPath)) {
          return reject(this.lang.errors.databaseNotFound);
        }
        const sqliteWrapper = new SqliteWrapper('itch.io', dbPath);
        sqliteWrapper.callWorker()
        .then((games: {[k: string]: any}[]) => {
          const success = games.map(({ title, verdict }: { [key:string]:string }) => {
            const { basePath, candidates } = JSON.parse(verdict);
            if (!candidates) {
              return null;
            }
            const exePath = candidates[0].path;
            let filePath = `${basePath}/${exePath}`
            if (os.type() == "Windows_NT") {
              filePath = filePath.replace('/', '\\');
            }
            else if (os.type() == "Linux" && candidates[0].flavor == "windows" && inputs.itchIoWindowsOnLinuxInstallDriveRedirect) {
              const parsedPath = path.win32.parse(filePath);
              const inDrivePath = filePath.slice(parsedPath.root.length);
              filePath = `${inputs.itchIoWindowsOnLinuxInstallDriveRedirect}/${inDrivePath}`;
              filePath = filePath.replace(/\\/g, "/");
            }
            return {
              extractedTitle: title,
              filePath: filePath,
              //fileLaunchOptions: not available
            };
          })
          .filter((gameDetails:any) => gameDetails !== null);
          resolve({success: success, failed:[]});
        })
        .catch((error) => {
          reject(this.lang.errors.fatalError__i.interpolate({error: error}))
        })
      } catch(error) {
        reject(this.lang.errors.fatalError__i.interpolate({error: error}));
      }
    })
  }
}
