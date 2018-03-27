import { userConfiguration } from "./user-configuration.schema";

export const configPresets = {
    type: 'object',
    patternProperties: {
        "^.+$": userConfiguration
    }
};