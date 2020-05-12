import { ValidatorModifier, AppSettings } from '../../models';

export const appSettings: ValidatorModifier<AppSettings> = {
    controlProperty: 'version',
    latestVersion: 0,
    fields: {
        undefined: {
            'version': { method: () => 0 },
            'enabledProviders': {
                method: (oldValue) => Array.isArray(oldValue) ? oldValue.filter((val) => val !== "ConsoleGrid" && val !== "retrogaming.cloud") : oldValue
            }
        }
    }
};
