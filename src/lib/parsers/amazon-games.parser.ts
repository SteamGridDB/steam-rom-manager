import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as sqlite from "better-sqlite3";
import * as path from 'path';
import { parse } from 'yaml';

export class AmazonGamesParser implements GenericParser {

  private get lang() {
    return APP.lang.amazonGamesParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Amazon Games',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'amazonGamesDirOverride': {
          label: this.lang.amazonGamesDirOverrideTitle,
          inputType: 'dir',
          validationFn: (input: string) => {
            if(!input || fs.existsSync(input) && fs.lstatSync(input).isFile()) {
              return null;
            } else {
              return this.lang.errors.invalidAmazonGamesDirOverride;
            }
          },
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      if(os.type()!='Windows_NT') {
        reject(this.lang.errors.osUnsupported);
      }

      const amazonGamesExe = inputs.amazonGamesDirOverride || path.resolve(`${process.env.APPDATA}\\..\\local\\Amazon Games`);
      const dbPath = `${amazonGamesExe}\\Data\\Games\\Sql\\GameInstallInfo.sqlite`;

      if(!fs.existsSync(dbPath)) {
        reject();
      }

      const db = sqlite(dbPath);
      const games: { extractedTitle:string, filePath:string }[] = db.prepare("select ProductTitle, InstallDirectory from DbSet")
      .all()
      .map(({ ProductTitle, InstallDirectory }: { [key:string]:string }) => {
        
        const fuelJson = fs.readFileSync(`${InstallDirectory}\\fuel.json`);
        // not really json so need to parse with yaml parser
        const { Main: { Command, Args } } = parse(fuelJson.toString());

        return { 
          extractedTitle: ProductTitle,
          startInDir: InstallDirectory,
          filePath: `${InstallDirectory}\\${Command}`,
          launchOptions: Args?.join(' '),
        };
      });

      resolve({success: games, failed:[]});
    })
  }
}
