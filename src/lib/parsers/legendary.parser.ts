import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";


export class LegendaryParser implements GenericParser {

  private get lang() {
    return APP.lang.legendaryParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Legendary',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'legendaryInstalledFile': {
          label: this.lang.legendaryInstalledFileTitle,
          placeholder: this.lang.legendaryInstalledFilePlaceholder,
          inputType: 'path',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      let appTitles: string[] = [];
      let appPaths: string[] = [];
      let appArgs: string[] = [];
      let legendaryInstalledFile: string = "";
      if(inputs.legendaryInstalledFile) {
        legendaryInstalledFile = inputs.legendaryInstalledFile;
      } else {
        legendaryInstalledFile = path.join(os.homedir(),'.config/legendary/installed.json');
      }
      if(!fs.existsSync(legendaryInstalledFile)) {
        return reject(this.lang.errors.legendaryNotInstalled)
      }
      Promise.resolve()
        .then(()=>{
          let installed = JSON.parse(fs.readFileSync(legendaryInstalledFile, 'utf-8'));
          for(let entry of Object.entries(installed)) {
            let app: any = entry[1];
            if (app.is_dlc === true || app.executable === "") {
              continue;
            }
            appTitles.push(app.title);
            appPaths.push(path.join(app.install_path,app.executable));
            appArgs.push(app.launch_parameters)
          }
        })
        .then(()=>{
          let parsedData: ParsedData = {
            success: [],
            failed:[]
          };
          for(let i=0; i < appTitles.length; i++){
            parsedData.success.push({
              extractedTitle: appTitles[i],
              filePath: appPaths[i],
              fileLaunchOptions: appArgs[i]
            });
          }
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
    })
  }
}
