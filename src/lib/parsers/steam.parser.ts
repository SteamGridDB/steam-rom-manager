import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as appid from "appid";
import * as bvdf from "binary-vdf";
import * as Sentry from '@sentry/electron';
import * as json from "../helpers/json";

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
      let appTitles: string[]=[];
      let appinfo_path = path.normalize(path.join(directories[0],'..','..','appcache','appinfo.vdf'));
      Promise.resolve()
        .then(()=>{
          for(let i=0; i<directories.length; i++) {
            let sharedconfig_path = path.join(directories[i],'7','remote','sharedconfig.vdf');
            try {
            let sharedconfig = genericParser.parse(fs.readFileSync(sharedconfig_path,'utf-8'));
            appIds = _.union(appIds, Object.keys(json.caseInsensitiveTraverse(sharedconfig, ['userroamingconfigstore','software','valve','steam','apps'])));
            } catch(err) {
              throw {error:err, path: sharedconfig_path}
            }
          }
          try {
            return bvdf.readAppInfo(fs.createReadStream(appinfo_path))
          } catch (err) {
            throw {error: err, path: appinfo_path}
          }
        })
        .catch((errordata) => {
          throw this.lang.errors.steamChanged__i.interpolate({error: errordata.error, file: errordata.path});
        })
        .then((appinfo)=>{
          appTitles = appinfo.filter((app:any)=>appIds.indexOf(app.entries.appid.toString())>=0).map((app:any)=>(app.entries.common||{}).name);
          return Promise.all(appTitles.map((title,i)=>{
            if(title){
              return Promise.resolve(title);
            } else {
              return appid(parseInt(appIds[i])).then((x:any)=>x.name);
            }
          }))
        })
        .then((titles)=>{
          appTitles=titles;
        })
        .then(()=>{
          let parsedData: ParsedData = {success: [], failed:[]};
          for(let i=0;i<appTitles.length; i++){
            parsedData.success.push({extractedTitle: appTitles[i].toString(), extractedAppId:appIds[i]});
          }
          resolve(parsedData);
        }).catch((err)=>{
          Sentry.captureException(err);
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });

    })
  }
}
