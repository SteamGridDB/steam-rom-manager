import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as bvdf from "binary-vdf-2";
import { glob } from "glob";
import * as json from "../helpers/json";

export class SteamParser implements GenericParser {

  private get lang() {
    return APP.lang.steamParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Steam',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'onlyGames': {
          label: this.lang.onlyGamesTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
            info: this.lang.docs__md.input.join('')
        },
        'onlyInstalled': {
          label: this.lang.onlyInstalledTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
            info: this.lang.docs__md.input.join('')
        },
        'sourceMods': {
          label: this.lang.sourceModsTitle,
          inputType: 'toggle',
          validationFn: (input: any) => { return null },
            info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve, reject)=>{
      if(!directories || directories.length==0){
        return reject(this.lang.errors.noSteamAccounts);
      }
      const appinfo_path = path.normalize(path.join(directories[0],'..','..','appcache','appinfo.vdf'));
      Promise.resolve()
      .then(()=>{
        return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
      })
      .catch((error: string) => {
        throw this.lang.errors.steamChanged__i.interpolate({error: error, file: appinfo_path});
      })
      .then((appinfo: any)=> {
        let categorizedAppIds: string[] = [];
        for(let directory of directories) {
          const sharedconfig_path = path.join(directory,'7','remote','sharedconfig.vdf');
          try {
            const sharedconfig = genericParser.parse(fs.readFileSync(sharedconfig_path,'utf-8'));
            categorizedAppIds = _.union(categorizedAppIds, Object.keys(json.caselessGet(sharedconfig, [['userroamingconfigstore','userlocalconfigstore'],['software'],['valve'],['steam'],['apps']]))).filter(appId => /^[0-9]*$/g.test(appId));
          } catch (e) {
            throw this.lang.errors.steamChanged__i.interpolate({error: e, file: sharedconfig_path})
          }
        }

        const libraryfolders_path = path.normalize(path.join(directories[0],'..','..','steamapps','libraryfolders.vdf'));
        let installedIds: string[];
        if(inputs.onlyInstalled) {
          try {
            const libraryFolders: any = genericParser.parse(fs.readFileSync(libraryfolders_path,'utf-8'));
            installedIds = _.union(...Object.values(libraryFolders.libraryfolders).map((x: any)=>Object.keys(x.apps)));
          } catch(e) {
            throw this.lang.errors.steamChanged__i.interpolate({error: e, file: libraryfolders_path});
          }
        }

        return appinfo.filter((app: any) =>  {
          return app.id
          && app.entries
          && app.entries.appid
          && app.entries.common
          && app.entries.common.name !== undefined
          && categorizedAppIds.includes(app.entries.appid.toString())
          && (!inputs.onlyGames || app.entries.common.type.toLowerCase()=='game')
          && (!inputs.onlyInstalled || installedIds.includes(app.entries.appid.toString()))
        }).map((app: any) => {
          return {
            title: app.entries.common.name.toString(),
            appid: app.entries.appid.toString()
          }
        })
      })
      .then((filteredApps: {title: string, appid: string}[])=>{
        // source mods
        return new Promise<{title: string, appid: string}[]>((resolve,reject)=>{
          let sourceModIds: string[] = [];
          if(inputs.sourceMods) {
            const wtfValve: number = 2147483649;
            const sourcemods_dir = path.normalize(path.join(directories[0],'..','..','steamapps','sourcemods'))
            glob('*/gameinfo.txt', {dot: true, cwd: sourcemods_dir}).then((files: string[]) => {
              let sourceMods: {title: string, appid: string}[] = [];
              files = files.sort();
              for(let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileData = fs.readFileSync(path.join(sourcemods_dir,file),'utf-8');
                const gameinfo: any = this.gameInfoParser(fileData);
                sourceMods.push({title: gameinfo.game, appid: (wtfValve + i).toString()})
              }
              resolve(filteredApps.concat(sourceMods))
            })
          } else {
            resolve(filteredApps.sort((a,b)=>a.title.localeCompare(b.title)))
          }
        })
      })
      .then((filteredApps: {title: string, appid: string}[]) => {
        let parsedData: ParsedData = {success: [], failed: []}
        for(let app of filteredApps){
          parsedData.success.push({
            extractedTitle: app.title,
            extractedAppId: app.appid
          });
        }
        resolve(parsedData);
      })
      .catch((err:string)=>{
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });
    })
  }


  gameInfoParser(fileContents: string) {
    const lines = fileContents.split('\n');
    const sep = '\t'
    const uncommentedLines = lines.map(line => line.replace(/\/\/.*/g, '').trim().replace(/[\s,\t]+/g, sep)).filter(line => line.length > 0).slice(1);
    // Parse uncommented lines into JSON object

    let currentObject: any = {};
    let i = 0;

    while (i < uncommentedLines.length) {
      const line = uncommentedLines[i].trim(); i++;
      if (line === '{') {
        continue;
      }
      else if (line === '}') {
        // If we encounter a closing brace, move back to the parent object
        if(currentObject.parent) {
          currentObject = currentObject.parent;
        }
      } else if (line.includes(sep)) {
        // If we encounter a line with a tab character, split it into a key-value pair and add it to the current object
        const [key, value] = line.split(sep).map(s => s.trim().replace(/\"/g,''));
        currentObject[key] = value;
      } else {
        // If we encounter a regular line, set it as the key of the current object and create a new object for its value
        const newObject: any = {};
        currentObject[line] = newObject;
        newObject.parent = currentObject;
        currentObject = newObject;
      }
    }
    return currentObject;
  }
}
