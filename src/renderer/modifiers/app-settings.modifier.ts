import { ValidatorModifier, AppSettings } from '../../models';
import * as _ from "lodash";

let versionUp = (version: number) => { return version + 1 };

export const appSettings: ValidatorModifier<AppSettings> = {
  controlProperty: 'version',
  latestVersion: 2,
  fields: {
    undefined: {
      'version': { method: () => 0 },
        'enabledProviders': {
        method: (oldValue) => Array.isArray(oldValue) ? oldValue.filter((val) => val !== "ConsoleGrid" && val !== "retrogaming.cloud") : oldValue
      },
      'environmentVariables': { method: (oldValue) => {
        let defaultValue = {retroarchPath:'',steamDirectoryGlobal:'',localImagesDirectory:''}
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
        let defaultValue = {retroarchPath:'',raCoresDirectory:'',steamDirectoryGlobal:'',localImagesDirectory:''}
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
    }
  }
};
