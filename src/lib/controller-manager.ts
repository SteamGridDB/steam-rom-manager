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
    console.log("constructing")
  }

  readControllers(data: { userId: string, steamDirectory: string, userData: PreviewDataUser }|undefined) {
    console.log("readingAvailableConfigs")
    let steamDirectory = 'C:\\Program Files (x86)\\Steam';
    let userId = '84977612';
    let localConfigPath = path.join(steamDirectory, 'userdata', userId, 'config', 'localconfig.vdf');
    let localConfig = genericParser.parse(fs.readFileSync(localConfigPath, 'utf-8'));
    console.log("localConfig", localConfig)
  }
}
