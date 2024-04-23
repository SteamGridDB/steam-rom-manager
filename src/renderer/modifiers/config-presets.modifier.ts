import { ValidatorModifier, UserConfiguration } from '../../models';
import * as _ from "lodash";

const controllerTypes = [
  'ps4',
  'ps5',
  'xbox360',
  'xboxone',
  'switch_joycon_left',
  'switch_joycon_right',
  'switch_pro',
  'neptune'
]

let replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';
let versionUp = (version: number) => { return version + 1 };

export const configPreset: ValidatorModifier<UserConfiguration> = {
  controlProperty: 'presetVersion',
  latestVersion: 9,
  fields: {
    undefined: {
      'presetVersion': { method: ()=>0 },
        'parserInputs': {
        method: (oldValue, oldConfiguration: any) => {
          let result: any = {};
          if(oldConfiguration.parserType=='Glob'){
            result['glob'] = oldConfiguration.parserInputs['glob']
          } else if(oldConfiguration.parserType=='Glob-regex') {
            result['glob-regex'] = oldConfiguration.parserInputs['glob-regex']
          } else if(oldConfiguration.parserType=='Epic') {
            result['manifests'] = null;
          }
          return result;
        }
      }
    },
    0: {
      'presetVersion': { method: versionUp },
      'parserInputs': {
        method: (oldValue, oldConfiguration: any)=>{
          let newValue = _.cloneDeep(oldValue);
          if(['Manual','Epic'].includes(oldConfiguration.parserType)) {
            if(oldConfiguration.parserType=='Epic') {
              newValue.epicManifests = oldValue.manifests || "";
            } else {
              newValue.manualManifests = oldValue.manifests || "";
            }
            delete newValue.manifests;
          }
          return newValue;
        }
      },
      'imageProviderAPIs': {
        method: (oldValue, oldConfiguration: any) => {
          return {
            SteamGridDB: {
              nsfw: false,
              humor: false,
              imageMotionTypes: ['static']
            }
          };
        }
      }
    },
    1: {
      'presetVersion': { method: versionUp },
      'imageProviderAPIs': {
        method: (oldValue, oldConfiguration: any) => {
          let newValue = _.cloneDeep(oldValue);
          newValue["SteamGridDB"]["styles"] = [];
          return newValue;
        }
      }
    },
    2: {
      'presetVersion': { method: versionUp },
      'imageProviderAPIs': {
        method: (oldValue, oldConfiguration: any) => {
          let newValue = _.cloneDeep(oldValue);
          newValue["SteamGridDB"]["stylesHero"] = [];
          newValue["SteamGridDB"]["stylesLogo"] = [];
          newValue["SteamGridDB"]["stylesIcon"] = [];
          return newValue;
        }
      }
    },
    3: {
      'presetVersion': { method: versionUp },
      'controllers': {
        method: () => { return {} }
      }
    },
    4: {
      'presetVersion': { method: versionUp },
      'controllers': {
        method: (oldValue, oldConfiguration: any) => {
          let newValue = _.cloneDeep(oldValue);
          for(let controllerType of controllerTypes) {
            newValue[controllerType]=newValue[controllerType] || null;
          }
          return newValue;
        }
      }
    },
    5: {
      'presetVersion': { method: versionUp },
      'defaultImage': {
        method: (oldValue, oldConfiguration) => {
          let newValue = {
            long: oldConfiguration.defaultImage || '',
            tall: oldConfiguration.defaulTallImage || '',
            hero: oldConfiguration.defaultHeroImage || '',
            logo: oldConfiguration.defaultLogoImage || '',
            icon: oldConfiguration.defaultIcon || ''
          }
          delete oldConfiguration.defaultImage;
          delete oldConfiguration.defaultTallImage;
          delete oldConfiguration.defaultHeroImage;
          delete oldConfiguration.defaultLogoImage;
          delete oldConfiguration.defaultIcon;
          return newValue;
        }
      },
      'localImages': {
        method: (oldValue, oldConfiguration) => {
          let newValue = {
            long: oldConfiguration.localImages || '',
            tall: oldConfiguration.localTallImages || '',
            hero: oldConfiguration.localHeroImages || '',
            logo: oldConfiguration.localLogoImages || '',
            icon: oldConfiguration.localIcons || ''
          }
          delete oldConfiguration.localImages || '';
          delete oldConfiguration.localTallImages || '';
          delete oldConfiguration.localHeroImages || '';
          delete oldConfiguration.localLogoImages || '';
          delete oldConfiguration.localIcons || '';
          return newValue;
        }
      }
    },
    6: {
      'presetVersion': { method: versionUp },
      'userAccounts': {
        method: (oldValue, oldConfiguration) => {
          delete oldValue.skipWithMissingDataDir;
          delete oldValue.useCredentials;
          return oldValue;
        }
      }
    },
    7: {
      'presetVersion': { method: versionUp },
      'steamInputEnabled':{
        method: (oldValue, oldConfiguration) => {
          return oldValue || '1';
        }
      }
    },
    8: {
      'presetVersion': { method: versionUp },
      'drmProtect': {
        method: (oldValue, oldConfiguration) => {
          return oldValue || false;
        }
      }
    }
  }
};
