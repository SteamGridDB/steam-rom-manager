import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as bvdf from "binary-vdf-2";
import { glob } from "glob";

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
        }
      }
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve, reject)=>{
      if(!directories || directories.length==0){
        reject(this.lang.errors.noSteamAccounts);
      }
      let appinfo_path = path.normalize(path.join(directories[0],'..','..','appcache','appinfo.vdf'));
      Promise.resolve()
      .then(()=>{
        return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
      })
      .catch((error: string) => {
        throw this.lang.errors.steamChanged__i.interpolate({error: error, file: appinfo_path});
      })
      .then((appinfo: any)=> {
        return new Promise((resolve, reject)=>{
          const filteredAppInfo = appinfo.filter((app: any) =>  {
            return app.id
            && app.entries
            && app.entries.appid
            && app.entries.common
            && app.entries.common.name
            && (!inputs.onlyGames || app.entries.common.type.toLowerCase()=='game')
          })

          try {
            if(inputs.onlyInstalled) {
              const libraryfolders_path = path.normalize(path.join(directories[0],'..','..','steamapps','libraryfolders.vdf'));
              const libraryFolders: any = genericParser.parse(fs.readFileSync(libraryfolders_path,'utf-8'));
              let installed_ids = _.union(Object.values(libraryFolders.libraryfolders).map((x: any)=>Object.keys(x.apps))).map(x=>x.toString());
            }
          } finally {
            const withGridsPromises: Promise<string[]>[] = []
            for(let userDir of directories) {
              withGridsPromises.push(this.getAppIdsWithGrids(userDir));
            }
            Promise.all(withGridsPromises).then((res: string[][])=>{
              resolve({
                idsWithGrids: _.union(...res),
                appinfo: filteredAppInfo
              })
            })
          }
        })
      })
      .then(({idsWithGrids, appinfo}: {idsWithGrids: string[], appinfo: any}) => {
        return idsWithGrids.map((appid: string)=>{
          let index = appinfo.map((app: any)=>app.entries.appid).indexOf(parseInt(appid));
          if(index !== -1) {
            return { title: appinfo[index].entries.common.name, appid: appid, type: appinfo[index].entries.common.type }
          }
        }).filter(x=>!!x).sort((a,b)=>{
          return a.title.localeCompare(b.title)
        })
      })
      .then((appsWithInfo: any[]) => {
        let parsedData: ParsedData = {success: [], failed: []}
        for(let i=0;i < appsWithInfo.length; i++){
          parsedData.success.push({
            extractedTitle: appsWithInfo[i].title.toString(),
            extractedAppId: appsWithInfo[i].appid.toString()
          });
        }
        resolve(parsedData);
      })
      .catch((err:string)=>{
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });

    })
  }

  private getAppIdsWithGrids(userDir: string): Promise<string[]> {
    return glob('./config/grid/*.*', {cwd: userDir, dot: true}).then((res)=>{
      let ids= _.uniq(res.map((x:string)=>path.basename(x).match(/^\d+/))
                      .filter((x:string[])=>!!x)
                      .map((x:string[])=>x[0])
                      .filter((x:string)=>x.length < 12))
                      return ids
    })
  }
}
