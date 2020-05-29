import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as appid from "appid";
import * as bvdf from "binary-vdf";
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

      let test_ids: string[]=[];
      let test_titles: string[]=[];
      let appinfo_path = path.normalize(path.join(directories[0],'..','..','appcache','appinfo.vdf'));
      Promise.resolve()
        .then(()=>{
          for(let i=0; i<directories.length; i++) {
            let sharedconfig_path = path.join(directories[i],'7','remote','sharedconfig.vdf');
            let sharedconfig = genericParser.parse(fs.readFileSync(sharedconfig_path,'utf-8'));
            let appkey= Object.keys(sharedconfig.UserRoamingConfigStore.Software.Valve.Steam).filter((key)=>key.toUpperCase()==='APPS')[0];
            test_ids= _.union(test_ids, Object.keys(sharedconfig.UserRoamingConfigStore.Software.Valve.Steam[appkey]));
          }
          return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
        })
        .catch((err) => {
          throw this.lang.errors.steamChanged;
        })
        .then((appinfo)=>{
          test_titles = appinfo.filter((app:any)=>test_ids.indexOf(app.entries.appid.toString())>=0).map((app:any)=>(app.entries.common||{}).name);
          return Promise.all(test_titles.map((title,i)=>{
            if(title){
              return Promise.resolve(title);
            } else {
              return appid(parseInt(test_ids[i])).then((x:any)=>x.name);
            }
          }))
        })
        .then((titles)=>{
          test_titles=titles;
        })
        .then(()=>{
          let parsedData: ParsedData = {success: [], failed:[]};
          for(let i=0;i<test_titles.length; i++){
            parsedData.success.push({extractedTitle: test_titles[i], extractedAppId:test_ids[i]});
          }
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}))
        });

    })
  }
}
