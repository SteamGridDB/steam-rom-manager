import { ParserInfo, GenericParser, ParsedData } from '../../models';
import { APP } from '../../variables';
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from '@node-steam/vdf';
import * as path from "path";

export class SteamParser implements GenericParser {

  private get lang() {
    return APP.lang.epicParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'EXE',
      info: this.lang.docs__md.self.join(''),
      inputs: {}
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>((resolve,reject)=>{

      let appTitles: string[] = [];
      let appPaths: string[] = [];

      Promise.resolve()
        .then(()=>{
          // TODO PARSE STUFF
        })
        .then(()=>{
          let parsedData: ParsedData = {success: [], failed:[]};
          for(let i=0;i<appTitles.length; i++){
            parsedData.success.push({extractedTitle: appTitles[i], filePath: appPaths[i]});
          }
          resolve(parsedData);
        }).catch((err)=>{
          reject(this.lang.errors.fatalError__i.interpolate({error: err}));
        });
    })
  }
}
