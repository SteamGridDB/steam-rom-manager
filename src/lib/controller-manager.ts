import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
import * as SteamCategories from 'steam-categories';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as json from './helpers/json'
import { PreviewData, PreviewDataUser, VDF_ExtraneousItemsData, Controllers } from '../models';
import { Acceptable_Error } from './acceptable-error';

export const controllerTypes = [
  'ps4',
  'ps5',
  'xbox360',
  'xboxone',
  'switch_joycon_left',
  'switch_joycon_right',
  'switch_pro',
  'neptune'
]
export const controllerNames = {
  ps4: 'PS4',
  ps5: 'PS5',
  xbox360: 'Xbox 360',
  xboxone: 'Xbox One',
  switch_joycon_left: 'Switch Joy-Con (Left)',
  switch_joycon_right: 'Switch Joy-Con (Right)',
  switch_pro: 'Switch Pro',
  neptune: 'Steam Deck'
}

const match = '(SRM)';
const topKey = 'controller_config';
const srmkey = 'srmAppId';

export class ControllerManager {
  private titleMap: {[appId: string]: string};
  constructor() {
    this.titleMap = {}
  }

  static createList(previewData: PreviewData) {
    const list = [];
    for(const steamDirectory in previewData) {
      for(const userId in previewData[steamDirectory]) {
        list.push({
          userId,
          steamDirectory,
          userData: previewData[steamDirectory][userId]
        });
      }
    }
    return list;
  }

  // TODO
  // 1) Convert to AppIDs [doesn't seem possible sadly]
  // 2) Make titlemap not a class variable

  static readTemplates(steamDirectory: string, controllerType: string) {
    try {

      let templateDirUser = path.join(steamDirectory, 'steamapps', 'workshop', 'content', '241100')
      let filesUser = glob.sync('*/*', { silent: true, dot: true, cwd: templateDirUser, absolute: true });
      let parsedTemplatesUser: any[] = filesUser.map((f: string) => Object.assign({ mappingId: f.split('/').slice(-2)[0] }, genericParser.parse(fs.readFileSync(f, 'utf-8'))))
        .filter((x: any) => !!x['controller_mappings']
          && !!x['controller_mappings']['title']
          && !!x['controller_mappings']['controller_type']
        )
        .filter(x=> x.controller_mappings.controller_type === 'controller_'+controllerType)
        .filter(x=> x.controller_mappings.title.slice(-match.length) === match)
        .map(x=>Object.assign({},{
          title: x.controller_mappings.title,
          mappingId: x.mappingId,
          profileType: "workshop"
        }));

      let templateDirValve = path.join(steamDirectory, 'controller_base', 'templates')
      let filesValve = glob.sync('*.vdf', { silent: true, dot: true, cwd: templateDirValve, absolute: true });
      let parsedTemplatesValve: any[] = filesValve.map((f: string) => Object.assign({ mappingId: path.basename(f) }, genericParser.parse(fs.readFileSync(f, 'utf-8'))))
        .filter((x: any) => !!x['controller_mappings']
          && !!x['controller_mappings']['title']
          && !!x['controller_mappings']['controller_type']
        )
        .filter(x=> x.controller_mappings.controller_type === 'controller_'+controllerType)
        .map(x=>Object.assign({},{
          title: json.caseInsensitiveTraverse(x,[["controller_mappings"],["localization"],["english"],["title"]]),
          mappingId: x.mappingId,
          profileType: "template"
        }));
      parsedTemplatesValve = _.uniqBy(parsedTemplatesValve,'title');

      let parsedTemplates = parsedTemplatesUser.concat(parsedTemplatesValve);

      return parsedTemplates
    } catch(e) {
      console.log(`Error getting Controller Templates:\n ${e}`)
      return [];
    }
  }

  static transformTitle(gameTitle: string) {
    return (gameTitle||"").toLowerCase().replace(/[/\\?%*:|"<>\.]/g,'')
  }


  setTemplate(configsetData: {[controllerType: string]: any},
    appId: string,
    controllerType: string,
    gameTitle: string,
    mappingId: string,
    profileType: string
  ) {
    if(!configsetData[controllerType]) {
      configsetData[controllerType] = {};
    }
    if(!configsetData[controllerType][topKey]) {
      configsetData[controllerType][topKey] = {};
    }
    let title = ControllerManager.transformTitle(gameTitle)
    configsetData[controllerType][topKey][title] = {
      [profileType]: mappingId,
      srmAppId: appId
    };
  }

  removeController(configsetData: {[controllerType: string]: any}, gameTitle: string, controllerType: string) {
    let title = ControllerManager.transformTitle(gameTitle);
    if(configsetData[controllerType] && configsetData[controllerType][topKey]) {
       if((configsetData[controllerType][topKey][title]||{})[srmkey]) {
        delete configsetData[controllerType][topKey][title];
      }
      if(Object.keys(configsetData[controllerType][topKey]).length == 0) {
        delete configsetData[controllerType];
      }
    }
  }

  removeAllControllersAndWrite(steamDirectory: string, userId: string): void {
    let configsetDir = ControllerManager.configsetDir(steamDirectory, userId);
    let configsetData = this.readControllers(configsetDir);
    this.removeAllControllers(configsetData);
    this.writeControllerFiles(configsetDir, configsetData);
  }

  removeAllControllers(configsetData: {[controllerType: string]: any}): void {
    for(const gameTitle of Object.values(this.titleMap)) {
      for(const controllerType of controllerTypes) {
        if(configsetData[controllerType] && configsetData[controllerType][topKey] && configsetData[controllerType][topKey][gameTitle]) {
          delete configsetData[controllerType][topKey][gameTitle];
        }
      }
    }
    for(const controllerType of controllerTypes) {
      if(configsetData[controllerType] && configsetData[controllerType][topKey] && Object.keys(configsetData[controllerType][topKey]).length == 0) {
        delete configsetData[controllerType]
      }
    }
  }

  readControllers(configsetDir: string) {
    let configsetData: {[controllerType: string]: any} = {};
    for(const controllerType of controllerTypes) {
      let configsetPath = path.join(configsetDir, `configset_controller_${controllerType}.vdf`);
      if(fs.existsSync(configsetPath)) {
        configsetData[controllerType] = genericParser.parse(fs.readFileSync(configsetPath, 'utf-8')) || {};
        if(!configsetData[controllerType][topKey]) {
          configsetData[controllerType][topKey] = {};
        }
        for(const game of Object.keys(configsetData[controllerType][topKey])) {
          for(const key of Object.keys(configsetData[controllerType][topKey][game])) {
            configsetData[controllerType][topKey][game][key] = String(configsetData[controllerType][topKey][game][key])
          }
          if(configsetData[controllerType][topKey][game][srmkey]) {
            this.titleMap[configsetData[controllerType][topKey][game][srmkey]] = game;
          }
        }
      }
    }
    return configsetData;
  }

  backupControllers(configsetDir: string) {
    for(const controllerType of controllerTypes) {
      let configsetPath = path.join(configsetDir, `configset_${controllerType}.vdf`);
      let bkPath = configsetPath + '.backup'
      if(fs.existsSync(configsetPath)) {
        fs.copyFileSync(configsetPath, bkPath)
      }
    }
  }

  private static configsetDir(steamDir: string, userId: string) {
    return path.join(steamDir, 'steamapps', 'common', 'Steam Controller Configs', userId,'config' );

  }

  private writeControllerFiles(configsetDir: string, configsetData: {[controllerType: string]: any}) {
    for(const controllerType of controllerTypes) {
      let configsetPath = path.join(configsetDir, `configset_controller_${controllerType}.vdf`)
      if(configsetData[controllerType]) {
        fs.outputFile(configsetPath, genericParser.stringify(configsetData[controllerType]))
      } else if(fs.existsSync(configsetPath)) {
        fs.unlinkSync(configsetPath)
      }
    }
  }

  writeControllers(user: { userId: string, steamDirectory: string, userData: PreviewDataUser }, extraneousAppIds: string[], removeAll: boolean) {
    let configsetDir = ControllerManager.configsetDir(user.steamDirectory, user.userId);
    this.backupControllers(configsetDir);
    let configsetData = this.readControllers(configsetDir);
    if(removeAll) {
      this.removeAllControllers(configsetData);
    }
    else {
      for(const controllerType of controllerTypes) {
        for (const appId of extraneousAppIds) {
          if(this.titleMap[appId]) {
            this.removeController(configsetData, this.titleMap[appId], controllerType)
          }
        }
      }
      for (const appId of Object.keys(user.userData.apps).filter((appId: string)=>user.userData.apps[appId].status ==='add')) {
        const app = user.userData.apps[appId];
        for(const controllerType of Object.keys(app.controllers)) {
          const controller = app.controllers[controllerType]
          if(controller) {
            this.setTemplate(configsetData, appId, controllerType, app.title, controller.mappingId, controller.profileType);
          } else {
            this.removeController(configsetData, app.title, controllerType)
          }
        }
      }
    }
    this.writeControllerFiles(configsetDir, configsetData);
  }

  save(previewData: PreviewData, extraneousAppIds: VDF_ExtraneousItemsData, removeAll: boolean) {
    return new Promise((resolveSave, rejectSave) => {
      let result = ControllerManager.createList(previewData).reduce((accumulatorPromise, user) => {
        return accumulatorPromise.then(() => {
          return this.writeControllers(user, extraneousAppIds[user.userId], removeAll);
        });
      }, Promise.resolve());

      return result.then(() => {
        resolveSave(extraneousAppIds);
      }).catch((error: Error) => {
        rejectSave(new Acceptable_Error(error));
      });
    });
  }
}
