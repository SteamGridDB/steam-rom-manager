import { ParserInfo, GenericParser, ParsedData, VDF_ListData } from '../../models';
import { APP } from '../../variables';
import * as path from 'path';
import * as steam from '../helpers/steam'
const shortcutsParser = require('steam-shortcut-editor');

import * as fs from 'fs';

export class NonSRMShortcutsParser implements GenericParser {

  private get lang() {
    return APP.lang.nonSRMShortcutsParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: 'Non-SRM Shortcuts',
      info: this.lang.docs__md.self.join(''),
      inputs: {}
    };
  }

  execute(directories: string[], inputs: { [key: string]: any }, cache?: { [key: string]: any }) {
    return new Promise<ParsedData>(async (resolve, reject)=>{
      if(!directories || directories.length==0){
        return reject(this.lang.errors.noSteamAccounts);
      }
      try {
        const parsedData: ParsedData = { success: [], failed: [] }
        for(let userdir of directories) {
          const shortcutsPath = path.join(userdir,'config','shortcuts.vdf')
          const addedItemsPath = path.join(userdir,'config','addedItemsV2.json')
          const addedItems = fs.existsSync(addedItemsPath) ? JSON.parse(fs.readFileSync(addedItemsPath,'utf8')) : {};
          const addedAppIds = Object.keys(addedItems.addedApps).filter(appId=>!addedItems.addedApps[appId].artworkOnly)
          if(fs.existsSync(shortcutsPath)) {
            const {shortcuts} = shortcutsParser.parseBuffer(fs.readFileSync(shortcutsPath));
            const mappedApps = shortcuts.filter((shortcut: any) => {
              return !addedAppIds.includes(steam.appifyShortcutId(shortcut.appid))
            }).map((shortcut: any) => { return {
              extractedTitle: shortcut.appname,
              extractedAppId: steam.shortenAppId(steam.appifyShortcutId(shortcut.appid))
            }})
            parsedData.success=[...parsedData.success, ...mappedApps]
          }
        }
        resolve(parsedData)
      } catch(e) {
        reject(this.lang.errors.fatalError__i.interpolate({error: e}))
      }
    })
  }
}