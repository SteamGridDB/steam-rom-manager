import { ValidatorModifier, AppSettings } from '../../models';
import * as _ from "lodash";

let versionUp = (version: number) => { return version + 1 };

export const appSettings: ValidatorModifier<AppSettings> = {
  controlProperty: 'version',
  latestVersion: 9,
  fields: {
    undefined: {
      'version': { method: () => 0 },
        'enabledProviders': {
        method: (oldValue) => Array.isArray(oldValue) ? oldValue.filter((val) => val !== "ConsoleGrid" && val !== "retrogaming.cloud") : oldValue
      },
      'environmentVariables': { method: (oldValue) => {
        let defaultValue = {retroarchPath:'',steamDirectory:'',localImagesDirectory:''}
        if(oldValue){
          let newValue=_.cloneDeep(oldValue);
          Object.keys(defaultValue).forEach((field: string) => {
            newValue[field] = newValue[field] || '';
          })
          return newValue;
        }
        return defaultValue;
      }
      }
    },
    0: {
      'version': { method: versionUp },
      'environmentVariables': { method: (oldValue) => {
        let defaultValue = {retroarchPath:'',raCoresDirectory:'',steamDirectory:'',localImagesDirectory:''}
        if(oldValue){
          return Object.assign(oldValue, {raCoresDirectory: ''});
        }
        return defaultValue;
      }
      }
    },
    1: {
      'version': {method: versionUp },
      'knownSteamDirectories': {
        method: (oldValue, oldConfiguration)=>{
          delete oldConfiguration.knownSteamDirectories;
        }
      }
    },
    2: {
      'version': {method: versionUp },
      'environmentVariables': {method: (oldValue)=>{
        let defaultValue = {retroarchPath:'',raCoresDirectory:'',steamDirectory:'',romsDirectoryGlobal:'',localImagesDirectory:''}
        // Fix a past mistake.
        if(oldValue.steamDirectoryGlobal) {
          let temp = Object.assign(oldValue,{steamDirectory: oldValue.steamDirectoryGlobal, romsDirectory: ''});
          delete temp.steamDirectoryGlobal;
          return temp;
        }
        if(oldValue){
          return Object.assign(oldValue, {romsDirectory: ''});
        }
        return defaultValue;
      }
      }
    },
    3: {
      'version': {method: versionUp},
      'language': {
        method: (oldValue) => {
          if(oldValue=='English') {return 'en-US'}
        }
      }
    },
    4: {
      'version': {method: versionUp},
      'theme': {
        method: (oldValue) => {
          return oldValue || 'Deck'
        }
      }
    },
    5: {
      'version': {method: versionUp},
      'environmentVariables': {method: (oldValue) => {
        oldValue['userAccounts'] = '';
        return oldValue;
      }}
    },
    6: {
      'version': {method: versionUp},
      'enabledProviders': {method: (oldValue) => {
        return oldValue.length ? ['sgdb', 'steamCDN'] : []
      }}
    },
    7: {
      'version': {method: versionUp},
      'dnsServers': {method: (oldValue) => {
        return [];
      }}
    },
    8: {
      'version': {method: versionUp},
      'previewSettings': {method: (oldValue, oldConfiguration) => {
        const oldPreload = oldConfiguration['preload'];
        delete oldConfiguration['preload'];
        if(oldPreload) {
          return {...oldConfiguration, imageLoadStrategy: 'loadPre'}
        } else {
          return {...oldConfiguration, imageLoadStrategy: 'loadLazy'}
        }
      }}
    }
  }
};
