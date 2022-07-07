import * as genericParser from '@node-steam/vdf';
import * as steam from './helpers/steam';
import * as SteamCategories from 'steam-categories';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import { globPromise } from './helpers/glob';
import * as json from './helpers/json'
import { PreviewDataUser } from '../models';

const controllerTypes = [
  'controller_ps4',
  'controller_ps5',
  'controller_xbox360',
  'controller_xboxone',
  'controller_switch_joycon',
  'controller_switch_pro',
  'controller_neptune'
]

const match = '(SRM)';
const topKey = 'controller_config';

export class ControllerManager {
  private configsetDir:string;
  private steamDirectory: string;
  private userID: string
  private configsetData: {[controllerType: string]: any} = {};
  constructor(steamDirectory: string, userID: string) {
    this.steamDirectory = steamDirectory;
    this.userID = userID
    this.configsetDir = path.join(steamDirectory,'steamapps','common','Steam Controller Configs', userID,'config' );
  }

  get data() {
    return this.configsetData;
  }

  // TODO
  // 1) Make reading templates synchronous
  // 2) State management
  // 3) Convert to AppIDs

  readTemplates() {
    return new Promise((resolve, reject) => {
      try {
        let templateDir = path.join(this.steamDirectory, 'steamapps', 'workshop', 'content', '241100')
        let files = fs.readdirSync(templateDir);
        globPromise('*/*', { silent: true, dot: true, cwd: templateDir, absolute: true }).then((files)=>{
          let parsedTemplates: any[] = files.map((f: string) => Object.assign({mapping_id: f.split('/').slice(-2)[0]}, genericParser.parse(fs.readFileSync(f, 'utf-8'))))
            .filter(x=>!!x['controller_mappings']
              && !!x['controller_mappings']['title']
              && !!x['controller_mappings']['controller_type']
            )
            .filter(x=> x.controller_mappings.title.slice(-match.length) === match)
            .map(x=>Object.assign({},{
              title: x.controller_mappings.title,
              controller_type: x.controller_mappings.controller_type,
              mapping_id: x.mapping_id
            }));
          resolve(parsedTemplates);
        });
      } catch(e) {
        reject(e);
      }
    })
  }


  setTemplate(gameTitle: string, controllerType: string, templateID: string) {
    if(!this.configsetData[controllerType]) {
      this.configsetData[controllerType] = {};
    }
    if(!this.configsetData[controllerType][topKey]) {
      this.configsetData[controllerType][topKey] = {};
    }
    this.configsetData[controllerType][topKey][gameTitle] = { workshop: templateID };
  }

  removeTemplate(gameTitle: string, controllerType: string) {
    this.configsetData[controllerType][topKey][gameTitle] = null;
    if(Object.keys(this.configsetData[controllerType][topKey]).length == 0) {
      this.configsetData[controllerType] = null;
    }
  }

  readControllers() {
    for(let controllerType of controllerTypes) {
      let configsetPath = path.join(this.configsetDir, `configset_${controllerType}.vdf`);
      if(fs.existsSync(configsetPath)) {
        this.configsetData[controllerType] = genericParser.parse(fs.readFileSync(configsetPath, 'utf-8')) || {};
        if(!this.configsetData[controllerType][topKey]) {
          this.configsetData[controllerType][topKey] = {};
        }
        for(let game of Object.keys(this.configsetData[controllerType][topKey])) {
          console.log(game)
          for(let key of Object.keys(this.configsetData[controllerType][topKey][game])) {
            console.log(key)
            this.configsetData[controllerType][topKey][game][key] = String(this.configsetData[controllerType][topKey][game][key])
          }
        }
      }
    };
  }

  backupControllers() {
    for(let controllerType of controllerTypes) {
      let configsetPath = path.join(this.configsetDir, `configset_${controllerType}.vdf`);
      let bkPath = configsetPath + '.backup'
      if(fs.existsSync(configsetPath)) {
        fs.copyFileSync(configsetPath, bkPath)
      }
    }
  }

  writeControllers() {
    for(let controllerType of Object.keys(this.configsetData)) {
      let configsetPath = path.join(this.configsetDir, `configset_${controllerType}.vdf`)
      fs.outputFile(configsetPath, genericParser.stringify(this.configsetData[controllerType]))
    }
  }

}
