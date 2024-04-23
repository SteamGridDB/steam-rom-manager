import { ValidatorModifier, UserConfiguration } from '../../models';
import * as unique_ids from "../../lib/helpers/unique-ids";
import { controllerTypes } from "../../lib/controller-manager";
import * as _ from "lodash";

let replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';
let versionUp = (version: number) => { return version + 1 };

export const userConfiguration: ValidatorModifier<UserConfiguration> = {
  controlProperty: 'version',
  latestVersion: 17,
  fields: {
    undefined: {
      'version': { method: () => 0 },
      'disabled': {
        method: (oldValue) => oldValue === undefined ? false : !!!oldValue,
          oldValuePath: 'enabled'
      },
      'parserType': { method: (oldValue) => (typeof oldValue === 'string' && /glob-regex/i.test(oldValue)) ? 'Glob-regex' : oldValue },
        'executableArgs': { method: replaceVariables_undefined },
      'onlineImageQueries': { method: replaceVariables_undefined },
      'localImages': { method: replaceVariables_undefined },
      'localTallImages': { method: replaceVariables_undefined },
      'localHeroImages': { method: replaceVariables_undefined },
      'localLogoImages': { method: replaceVariables_undefined },
      'localIcons': { method: replaceVariables_undefined }
    },
    0: {
      'version': { method: versionUp },
      'titleModifier': {
        method: (oldValue) => typeof oldValue === 'string' ? oldValue.replace(/\${title}/gi, '${fuzzyTitle}') : '${fuzzyTitle}'
      }
    },
    1: {
      'version': { method: versionUp },
      'imageProviders': {
        method: (oldValue) => Array.isArray(oldValue) ? oldValue.filter((val) => val !== "ConsoleGrid") : oldValue
      }
    },
    2: {
      'version': { method: versionUp },
      'imageProviders': {
        method: (oldValue) => Array.isArray(oldValue) ? oldValue.filter((val)=> ['SteamGridDB','GoogleImages'].indexOf(val)>=0) : oldValue
      },
      'parserId': {
        method: (oldValue) => oldValue || unique_ids.newParserId()
      },
      'parserInputs': {
        method: (oldValue) => {
          let newValue = _.cloneDeep(oldValue);
          delete newValue['steam']
          return newValue
        }
      },
      'executable': {
        method: (oldValue, oldConfiguration: any) => {
          if(!oldValue){
            let result = {
              path: oldConfiguration.executableLocation,
              appendArgsToExecutable: oldConfiguration.appendArgsToExecutable,
              shortcutsPassthrough: oldConfiguration.titleFromVariable.shortcutsPassthrough
            }
            delete oldConfiguration.executableLocation;
            delete oldConfiguration.appendArgsToExecutable;
            delete oldConfiguration.titleFromVariable.shortcutsPassthrough;
            return result
          }
        }
      }
    },
    3: {
      'version': { method: versionUp},
      'localIcons': { method: replaceVariables_undefined }
    },
    4: {
      'version': { method: versionUp },
      'parserType': { method: (pType)=> pType || 'Glob' },
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
    5: {
      'version': { method: versionUp },
      'fuzzyMatch': {
        method: (oldValue, oldConfiguration: any)=>{
          delete oldConfiguration.advanced;
          let newValue = _.cloneDeep(oldValue);
          delete newValue.use;
          return newValue
        }
      }
    },
    6: {
      'version': { method: versionUp },
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
      }
    },
    7: {
      'version': { method: versionUp },
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
    8: {
      'version': { method: versionUp },
      'imageProviderAPIs': {
        method: (oldValue, oldConfiguration: any) => {
          let newValue = _.cloneDeep(oldValue);
          newValue["SteamGridDB"]["styles"] = [];
          return newValue;
        }
      }
    },
    9: {
      'version': { method: versionUp },
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
    10: {
      'version': { method: versionUp },
      'controllers': {
        method: () => { return {} }
      }
    },
    11: {
      'version': { method: versionUp },
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
    12: {
      'version': { method: versionUp },
      'controllers': {
        method: (oldValue, oldConfiguration: any) => {
          let newValue = _.cloneDeep(oldValue);
          for(let controllerType of controllerTypes) {
            if(newValue[controllerType] && !newValue[controllerType].profileType) {
              newValue[controllerType].profileType = "workshop";
            }
          }
          return newValue;
        }
      }
    },
    13: {
      'version': { method: versionUp },
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
    14: {
      'version': { method: versionUp },
      'userAccounts': {
        method: (oldValue, oldConfiguration) => {
          delete oldValue.skipWithMissingDataDir;
          delete oldValue.useCredentials;
          return oldValue;
        }
      }
    },
    15: {
      'version': { method: versionUp },
      'steamInputEnabled': {
        method: () => { return '1' }
      }
    },
    16: {
      'version': { method: versionUp },
      'drmProtect': {
        method: (oldValue, oldConfiguration) => { return oldValue || false }
      }
    }
  }
};
