import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as Sentry from '@sentry/electron';

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
  getParserInfo(): ParserInfo {
    return {
      title: 'UPlay',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'uplayDir': {
          label: this.lang.uplayDirTitle,
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
      let appPaths: string[] = [];
'> UPlay parser failed with fatal error:\n ${error}'
      Promise.resolve()
      .then(()=>{
        // TODO PARSE STUFF
        let configPath = "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\cache\\configuration\\configurations";
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
              } catch (e) {
                console.log(e)
              }

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
        let parsedGames = finalOutput.filter(x=>x&&x.root&&x.root.start_game&&!x.root.third_party_platform).map(x=>x.root)
        console.log(parsedGames)
      })
      .then(()=>{
        let parsedData: ParsedData = {success: [], failed:[]};
        for(let i=0;i<appTitles.length; i++){
          parsedData.success.push({extractedTitle: appTitles[i], filePath: appPaths[i]});
        }
        resolve(parsedData);
      }).catch((err)=>{
        Sentry.captureException(err);
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }
}
