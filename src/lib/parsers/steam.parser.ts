import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";

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
    return Promise.resolve().then(()=>{
      let test_titles=['Portal','Half-Life']
      let test_ids = ['235342','12342134']
      // get titles and app ids from steam
      let parsedData: ParsedData = {success: [], failed:[]};
      for(let i=0;i<test_titles.length; i++){
        parsedData.success.push({extractedTitle: test_titles[i], extractedAppId:test_ids[i]});
      }
      return parsedData;
    });
  }
}
