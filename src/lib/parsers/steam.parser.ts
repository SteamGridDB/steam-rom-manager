import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as bvdf from "binary-vdf";
import * as json from "../helpers/json";
import {globPromise} from '../helpers/glob';
export class SteamParser implements GenericParser {

  private get lang() {
    return APP.lang.steamParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Steam',
      info: this.lang.docs__md.self.join(''),
      inputs: {}
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{
      if(!directories || directories.length==0){
        reject(this.lang.errors.noSteamAccounts);
      }

      let appIds: string[]=[];
      let appinfo_path = path.normalize(path.join(directories[0],'..','..','appcache','appinfo.vdf'));
      Promise.resolve()
      .then(()=>{
        return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
      })
      .catch((error: string) => {
        throw this.lang.errors.steamChanged__i.interpolate({error: error, file: appinfo_path});
      })
      .then((appinfo: any)=> {
        return new Promise((resolve,reject)=>{
          console.log("appinfo length", appinfo.length)
          let filteredAppInfo = appinfo.filter((app: any) =>  {
            return app.id
            && app.entries
            && app.entries.appid
            && app.entries.common
            && app.entries.common.name
            && app.entries.common.type.toLowerCase()=='game'
          })
          console.log("appinfo", filteredAppInfo)
          let withGridsPromises: Promise<string[]>[] = []
          for(let userDir of directories) {
            withGridsPromises.push(this.getAppIdsWithGrids(userDir));
          }
          Promise.all(withGridsPromises).then((res: string[][])=>{
            resolve({
              idsWithGrids: _.union(...res),
              appinfo: filteredAppInfo
            })
          })
        })
      })
      .then(({idsWithGrids, appinfo}: {idsWithGrids: string[], appinfo: any}) => {
        console.log("idswithgrids", idsWithGrids);
        console.log("filteredAppInfo", appinfo);
        return idsWithGrids.map((appid: string)=>{
           let index = appinfo.map((app: any)=>app.entries.appid).indexOf(parseInt(appid));
           if(index !== -1) {
             return { title: appinfo[index].entries.common.name, appid: appid }
           }
        }).filter(x=>!!x).sort((a,b)=>{
          return a.title.localeCompare(b.title)
        })
      })
      .then((appsWithInfo: any[]) => {
        console.log("appsWithInfo", appsWithInfo)
        let parsedData: ParsedData = {success: [], failed: []}
        for(let i=0;i < appsWithInfo.length; i++){
          parsedData.success.push({
            extractedTitle: appsWithInfo[i].title.toString(),
            extractedAppId: appsWithInfo[i].appid.toString()
          });
        }
        resolve(parsedData);
      })
      .catch((err)=>{
        reject(this.lang.errors.fatalError__i.interpolate({error: err}));
      });

    })
  }

  private getAppIdsWithGrids(userDir: string): Promise<string[]> {
    return globPromise('./config/grid/*.*', {cwd: userDir, dot: true}).then((res)=>{
      let ids= _.uniq(res.map(x=>path.basename(x).match(/^\d+/))
                      .filter(x=>!!x)
                      .map(x=>x[0])
                      .filter(x=>x.length < 12))
                      return ids
    })
  }
}


// Promise.resolve()
//   .then(()=>{
//     for(let i=0; i < directories.length; i++) {
//       let sharedconfig_path = path.join(directories[i],'7','remote','sharedconfig.vdf');
//       try {
//       let sharedconfig = genericParser.parse(fs.readFileSync(sharedconfig_path,'utf-8'));
//       appIds = _.union(appIds, Object.keys(json.caseInsensitiveTraverse(sharedconfig, [['userroamingconfigstore','userlocalconfigstore'],['software'],['valve'],['steam'],['apps']])));
//       } catch(err) {
//         throw {error: err, path: sharedconfig_path}
//       }
//     }
//     try {
//       return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
//     } catch (err) {
//       throw {error: err, path: appinfo_path}
//     }
//   })
//   .catch((errordata) => {
//     throw this.lang.errors.steamChanged__i.interpolate({error: errordata.error, file: errordata.path});
//   })
//   .then((appinfo)=>{
//     return Promise.all(appIds.filter(appId => /^[0-9]*$/g.test(appId)).map(appId =>{
//       let infoIndex = appinfo.map((app: any)=>app.entries.appid).indexOf(parseInt(appId));
//       if(infoIndex>=0 && (appinfo[infoIndex].entries.common||{}).name){
//         return Promise.resolve({title: (appinfo[infoIndex].entries.common||{}).name, appid: appId});
//       } else {
//         return appid(parseInt(appId)).then((x: any)=>{
//           return {title: (x||{}).name, appid: appId}
//         });
//       }
//     })).then((appsWithInfo: any[])=>appsWithInfo.filter((x: any)=>x.title !== undefined))
//   })
