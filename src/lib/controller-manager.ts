import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
import * as SteamCategories from 'steam-categories';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as json from './helpers/json'
import { PreviewData, PreviewDataUser, VDF_ExtraneousItemsData, Controllers, ControllerTemplate } from '../models';
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
const srmKey = 'srmAppId';
const srmParserKey = 'srmParserId';

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

  static readTemplates(steamDirectory: string, controllerType: string) {
    let templateDirUser = path.join(steamDirectory, 'steamapps', 'workshop', 'content', '241100')
    let filesUser = glob.sync('*/*', { dot: true, cwd: templateDirUser, absolute: true });
    let parsedTemplatesUser: ControllerTemplate[] = filesUser.filter((f: string) => fs.lstatSync(f).isFile())
      .map((f: string) => Object.assign({ mappingId: f.split(path.sep).slice(-2)[0] }, genericParser.parse(fs.readFileSync(f, 'utf-8'))))
      .filter((x: any) => !!x['controller_mappings']
        && !!x['controller_mappings']['title']
        && !!x['controller_mappings']['controller_type']
      )
      .filter((x: any) => x.controller_mappings.controller_type === 'controller_'+controllerType)
      .filter((x: any) => String(x.controller_mappings.title).slice(-match.length) === match)
      .map((x: any) => Object.assign({}, {
        title: x.controller_mappings.title,
        mappingId: x.mappingId,
        profileType: "workshop"
      }));
    parsedTemplatesUser.sort((a, b) => a.title.localeCompare(b.title));

    let templateDirValve = path.join(steamDirectory, 'controller_base', 'templates')
    let filesValve = glob.sync('*.vdf', { dot: true, cwd: templateDirValve, absolute: true });
    let parsedTemplatesValve: ControllerTemplate[] = filesValve.map((f: string) => Object.assign({ mappingId: path.basename(f) }, genericParser.parse(fs.readFileSync(f, 'utf-8'))))
      .filter((x: any) => !!x['controller_mappings']
        && !!x['controller_mappings']['title']
          && !!x['controller_mappings']['controller_type']
        )
        .filter((x: any) => x.controller_mappings.controller_type === 'controller_'+controllerType)
        .map((x: any) => Object.assign({}, {
          title: json.caselessGet(x,[["controller_mappings"],["localization"],["english"],["title"]]) || json.caselessGet(x,[["controller_mappings"],["title"]]),
          mappingId: x.mappingId,
          profileType: "template"
        }));
    parsedTemplatesValve = _.uniqBy(parsedTemplatesValve,'title');
    parsedTemplatesValve.sort((a, b) => a.title.localeCompare(b.title));
    return parsedTemplatesUser.concat(parsedTemplatesValve);
  }

  static transformTitle(gameTitle: string) {
    return (gameTitle||"").toLowerCase().replace(/[/\\?%*:|"<>\.]/g,'')
  }


  private setTemplate(configsetData: {[controllerType: string]: any},
    appId: string,
    parserId: string,
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
      [srmKey]: "a"+appId,
      [srmParserKey]: "p"+parserId //prevents interpretation as an integer, which causes rounding errors
    };
  }

  removeController(configsetData: {[controllerType: string]: any}, gameTitle: string, controllerType: string) {
    let title = ControllerManager.transformTitle(gameTitle);
    if(configsetData[controllerType] && configsetData[controllerType][topKey]) {
       if((configsetData[controllerType][topKey][title]||{})[srmKey]) {
        delete configsetData[controllerType][topKey][title];
      }
      if(Object.keys(configsetData[controllerType][topKey]).length == 0) {
        delete configsetData[controllerType];
      }
    }
  }

  removeAllControllersAndWrite(steamDirectory: string, userId: string, parserId?: string): void {
    let configsetDir = ControllerManager.configsetDir(steamDirectory, userId);
    let configsetData = this.readControllers(configsetDir);
    this.removeAllControllers(configsetData, parserId);
    this.writeControllerFiles(configsetDir, configsetData);
  }

  removeAllControllers(configsetData: {[controllerType: string]: any}, parserId?: string): void {
    for(const gameTitle of Object.values(this.titleMap)) {
      for(const controllerType of controllerTypes) {
        if(configsetData[controllerType] && configsetData[controllerType][topKey] && configsetData[controllerType][topKey][gameTitle]) {
          if(!parserId || configsetData[controllerType][topKey][gameTitle][srmParserKey] == "p"+parserId) {
            delete configsetData[controllerType][topKey][gameTitle];
          }
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
          if(configsetData[controllerType][topKey][game][srmKey]) {
            this.titleMap[configsetData[controllerType][topKey][game][srmKey]] = game;
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

  static configsetDir(steamDir: string, userId: string) {
    return path.join(steamDir, 'steamapps', 'common', 'Steam Controller Configs', userId,'config' );

  }

  private writeControllerFiles(configsetDir: string, configsetData: {[controllerType: string]: any}) {
    for(const controllerType of controllerTypes) {
      let configsetPath = path.join(configsetDir, `configset_controller_${controllerType}.vdf`)
      if(configsetData[controllerType]) {
        fs.outputFileSync(configsetPath, genericParser.stringify(configsetData[controllerType]))
      } else if(fs.existsSync(configsetPath)) {
        fs.unlinkSync(configsetPath)
      }
    }
  }

  writeControllers(user: { userId: string, steamDirectory: string, userData: PreviewDataUser }, extraneousAppIds: string[]) {
    let configsetDir = ControllerManager.configsetDir(user.steamDirectory, user.userId);
    this.backupControllers(configsetDir);
    let configsetData = this.readControllers(configsetDir);
    for(const controllerType of controllerTypes) {
      for (const appId of extraneousAppIds) {
        if(this.titleMap["a"+appId]) {
          this.removeController(configsetData, this.titleMap["a"+appId], controllerType)
        }
      }
    }
    for (let appId of Object.keys(user.userData.apps).filter((appId: string)=>user.userData.apps[appId].status ==='add')) {
      const app = user.userData.apps[appId];
      if(app.changedId) {
        appId = app.changedId;
      }
      const title = app.parserType == 'Steam' ? steam.shortenAppId(appId) : app.title;
      const parserId = app.parserId;
      for(const controllerType of Object.keys(app.controllers)) {
        const controller = app.controllers[controllerType];
        if(controller) {
          this.setTemplate(configsetData, appId, parserId, controllerType, title, controller.mappingId, controller.profileType);
        } else {
          this.removeController(configsetData, title, controllerType)
        }
      }
    }
    this.writeControllerFiles(configsetDir, configsetData);
  }

  save(previewData: PreviewData, extraneousAppIds: VDF_ExtraneousItemsData) {
    return new Promise((resolveSave, rejectSave) => {
      let result = ControllerManager.createList(previewData).reduce((accumulatorPromise, user) => {
        return accumulatorPromise.then(() => {
          return this.writeControllers(user, extraneousAppIds[user.steamDirectory][user.userId]);
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
