import { JsonValidatorModifier } from '../../shared/models/json-helpers.model';

let replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';
let versionUp = (version: number) => { return version + 1 };

export const userConfiguration: JsonValidatorModifier = {
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
        'localIcons': { method: replaceVariables_undefined }
    },
    0: {
        'version': { method: versionUp },
        'titleModifier': {
            method: (oldValue) => typeof oldValue === 'string' ? oldValue.replace(/\${title}/gi, '${fuzzyTitle}') : '${fuzzyTitle}'
        }
    }
};

export const userConfigurationVersion: number = 1;