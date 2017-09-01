import { JsonValidatorModifier } from '../../shared/models/json-helpers.model';

let replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';

export const userConfiguration: JsonValidatorModifier = {
    undefined: {
        'version': { method: () => 0 },
        'disabled': { 
            method: (oldValue) => oldValue === undefined ? false : !!!oldValue,
            oldValuePath: 'enabled'
        },
        'executableArgs': { method: replaceVariables_undefined },
        'onlineImageQueries': { method: replaceVariables_undefined },
        'localImages': { method: replaceVariables_undefined },
        'localIcons': { method: replaceVariables_undefined }
    }
};

export const userConfigurationVersion: number = 0;