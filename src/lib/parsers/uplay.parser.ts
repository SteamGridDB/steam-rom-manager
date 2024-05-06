import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import Registry from "winreg";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as os from "os";

export class UPlayParser implements GenericParser {

  private get lang() {
    return APP.lang.uplayParser;
  }
  private generateHexArray(str: string) {
    const lines = [];
    const split = str.match(/.{1,2}/g);
    let line = '';
    for (let i = 0; i < split.length; i++) {
      line += split[i];
      if (split[i] === '0a' && split[i - 2] !== '08') {
        lines.push(line);
        line = '';
      }
    }
    return lines;
  }
  private convertLaunchId(hexArr: number[]) {
    let launchId = 0;
    let multiplier = 1;
    for (let i = 0; i < hexArr.length; i++, multiplier *= 256) {
      if (hexArr[i] === 16) {
        break;
      }
      launchId += (hexArr[i] * multiplier);
    }

    if (launchId > 256 * 256) {
      launchId -= (128 * 256 * Math.ceil(launchId / (256 * 256)));
      launchId -= (128 * Math.ceil(launchId / 256));
    } else if (launchId > 256) {
      launchId -= (128 * Math.ceil(launchId / 256));
    }
    return launchId;
  }
  private processRegKey(key: any) {
    return new Promise((resolve) => {
      const id = path.basename(key.key);
      key.get('InstallDir', (err: string, installDir: any) => {
        resolve({
          id,
          installDir: installDir ? installDir.value: "",
        });
      });
    });
  }
  private getRegInstalled() {
    return new Promise<{[key: string] : any}>((resolve, reject) => {
      const reg = new Registry({
        hive: Registry.HKLM,
        arch: 'x86',
        key: '\\SOFTWARE\\Ubisoft\\Launcher\\Installs',
      });
      reg.keys((err: Error, keys: any[]) => {
        if (err) {
          return reject(err);
        }
        if (keys) {
          const promiseArr = keys.map((key: any) => this.processRegKey(key));
          Promise.all(promiseArr).then((resultsArray) => {
            let out: {[k: string]: string} = {};
            resultsArray.forEach((item: any) => {
              if(item.installDir) {
                out[String(item.id)] = item.installDir;
              }
            });
            return resolve(out);
          });
        } else {
          return resolve({});
        }
      });
    });
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'UPlay',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'uplayDir': {
          label: this.lang.uplayDirTitle,
          placeholder: this.lang.uplayDirPlaceholder,
          inputType: 'dir',
          validationFn: null,
          info: this.lang.docs__md.input.join('')
        },
        'uplayLauncherMode': {
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

      let appTitles: string[] = [];
      let appNames: string[] = [];
      let appPaths: string[] = [];
      let installDirDictPromise: Promise<any> = null;
      let ubisoftDir = inputs.uplayDir || 'C:\\Program Files (x86)\\Ubisoft';
      if(os.type() === 'Windows_NT') {
        installDirDictPromise = this.getRegInstalled();
      } else{
        return reject(this.lang.errors.uplayNotCompatible)
        //TODO Mac Handling
        // installDirDictPromise = new Promise<{[key: string] : any}>((resolve,reject)=>{
        //   resolve({});
        // })
      }
      if(!fs.existsSync(ubisoftDir)) {
        return reject(this.lang.errors.uplayDirNotFound)
      }
      let configPath = path.join(ubisoftDir,"Ubisoft Game Launcher","cache","configuration","configurations")
      if(!fs.existsSync(configPath)) {
        return reject(this.lang.errors.uplayNotInstalled)
      }

      installDirDictPromise
      .then((installDirDict: {[key: string] : any})=>{
        let configHex = fs.readFileSync(configPath,'hex');
        let finalOutput: any[] = [];
        let game: string[] = ['root:'];
        let launcherId: number = null;
        let end = false;

        this.generateHexArray(configHex).forEach((hexStr: string)=>{
          const line = Buffer.from(hexStr, 'hex').toString('utf8').replace(/\n/g, '');
          const foundId = hexStr.match(/08([0-9a-f]+)10[0-9a-f]+1a/);
          if (foundId) {
            if (game.length === 1) {
              let hexChars = foundId[1].match(/.{1,2}/g);
              let ints = hexChars.map((x) => parseInt(x, 16));
              launcherId = this.convertLaunchId(ints);
              return;
            } if (game.length > 1) {
              try {
                let gameParsed: any = yaml.load(game.join('\n'), {'json': true });
                if (launcherId) {
                  gameParsed.root.launcher_id = launcherId;
                }
                finalOutput.push(gameParsed);
              } catch (e) {  }

              let hexChars = foundId[1].match(/.{1,2}/g);
              let ints = hexChars.map((x) => parseInt(x, 16));
              launcherId = this.convertLaunchId(ints);
              game = ['root:'];
              return;
            }
          }
          if (line.indexOf('localizations:') === 0) {
            end = true;
            return;
          }
          // Already manually saved "root:"
          if (line.trim().includes('root:') && !line.trim().includes('_')) {
            end = false;
            return;
          }
          if (!end) {
            // Save lines if starts with spaces
            if (line.substr(0, 2) === '  ' && !line.includes('sort_string:')) {
              game.push(line);
            }
          }
        });
        let parsedGames = finalOutput.filter(x=>x&&x.root&&x.root.start_game&&!x.root.third_party_platform).map(x=>x.root);
        parsedGames.forEach((item: any)=>{
          let basePath = (item.start_game.offline || item.start_game.online).executables[0].path.relative;
          if((item.installer||{}).game_identifier && item.launcher_id && installDirDict[item.launcher_id.toString()] && basePath) {
            appTitles.push(item.installer.game_identifier.toString());
            appNames.push(item.launcher_id.toString());
            appPaths.push(path.join(installDirDict[item.launcher_id.toString()],basePath));
          }
        });
      })
      .then(()=>{
        let parsedData: ParsedData = {
          executableLocation: `C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
          success: [],
          failed:[]
        };
        for(let i=0;i < appTitles.length; i++){
          parsedData.success.push({
            extractedTitle: appTitles[i],
            extractedAppId: appNames[i],
            launchOptions:  `-windowStyle hidden -NoProfile -ExecutionPolicy Bypass -Command "&Start-Process \\"uplay://launch/${appNames[i]}\\""`,
            filePath: appPaths[i],
            //fileLaunchOptions: not available
          });
        }
        resolve(parsedData);
      }).catch((err)=>{
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }
}
