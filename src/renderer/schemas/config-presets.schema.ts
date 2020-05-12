import { userConfiguration } from "./user-configuration.schema";
import { cloneDeep } from "lodash";

export const configPresets = {
    type: 'object',
    patternProperties: {
        "^.+$": (() => {
            let config = cloneDeep(userConfiguration);
            delete config.properties.version;
            delete config.properties.parserId;
            let addStrictValidation = (data: any) => {
                if (data['type'] === 'object') {
                    if (data['properties'] !== undefined) {
                        const keys = Object.keys(data['properties']);

                        data['required'] = keys;
                        data['additionalProperties'] = false;

                        for (const key of keys) {
                            addStrictValidation(data['properties'][key]);
                        }
                    }
                    else if (data['propertyNames'] !== undefined && data['propertyNames']['enum'] !== undefined){
                        data['required'] = data['propertyNames']['enum'];
                    }
                }
            };
            addStrictValidation(config);

            return config;
        })()
    }
};
