import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
import * as SteamCategories from 'steam-categories';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import { PreviewDataUser } from '../models';
export class ControllerManager {

  constructor() {
  }

  //TODO This manager is in progress
  /*
So add an entry in   `.\userdata\84977612\241100\remotecache.vdf`

Then create the directory with (lower case of title) so that for each controller you can put `.\steamapps\common\Steam Controller Configs\84977612\config\geographical adventures\controller_xbox360.vdf"`

Templates / existing configurations can be found in C:\Program Files (x86)\Steam\steamapps\workshop\content\241100 as .bin files.
   */

  readControllers(steamDirectory: string) {
    console.log("readingAvailableConfigs")
    let files = fs.readdirSync(path.join(steamDirectory,'steamapps','workshop','content','241100'));
    console.log('files', files)
    // let steamDirectory = 'C:\\Program Files (x86)\\Steam';
    // let userId = '84977612';
    // let localConfigPath = path.join(steamDirectory, 'userdata', userId, 'config', 'localconfig.vdf');
    // let localConfig = genericParser.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    // console.log("localConfig", localConfig)

  }

  backupController(controllerType: string) {

  }

  restoreController(controllerType: string) {

  }

  setController(controllerType: string) {

  }
}
