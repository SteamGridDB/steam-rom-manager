import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";
import * as appid from "appid";
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

  execute(directory: string, inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    let test_ids: string[]=[];
    let test_titles: string[]=[];
    return Promise.resolve().then(()=>{
      let sharedconfig_path = path.join(directory,'7','remote','sharedconfig.vdf');
      let sharedconfig = genericParser.parse(fs.readFileSync(sharedconfig_path,'utf-8'));
      test_ids = Object.keys(sharedconfig.UserRoamingConfigStore.Software.Valve.Steam.Apps).map((id)=>id.replace(/\"/g,""));
      let titlePromises = test_ids.map((id: string)=>appid(parseInt(id)));
      return Promise.all(titlePromises)
    }).then((data: {appid: number, name: string}[])=>{
      test_titles = data.map((item)=>item.name)
      let parsedData: ParsedData = {success: [], failed:[]};
      for(let i=0;i<test_titles.length; i++){
        parsedData.success.push({extractedTitle: test_titles[i], extractedAppId:test_ids[i]});
      }
      return parsedData;
    });
  }
}
