import { ValidatorModifier, UserConfiguration } from '../../models';
import * as unique_ids from "../../lib/helpers/unique-ids";
import * as _ from "lodash";

let replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';
let versionUp = (version: number) => { return version + 1 };

export const userConfiguration: ValidatorModifier<UserConfiguration> = {
  controlProperty: 'version',
  latestVersion: 5,
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
      'parserType': { method: (pType)=> pType || 'Glob' }
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
    }
  }
};
