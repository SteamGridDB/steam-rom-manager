import { configPresets } from "./src/renderer/schemas/config-presets.schema";
import { customVariables } from "./src/renderer/schemas/custom-variables.schema";
import * as json from "./src/lib/helpers/json";

let isValid = true;
const validator = new json.Validator(undefined, undefined, { useDefaults: false });

json.read('./files/configPresets.json').then((data: object) => {
    if (data !== null && !validator.setSchema(configPresets).validate(data).isValid()){
        throw new Error(`\r\n${validator.errorString}`);
    }
}).catch((error: Error) => {
    process.stderr.write(`${error.stack}\r\n`);
    isValid = false;
}).then(() => {
    return json.read('./files/customVariables.json');
}).then((data: object) => {
    if (data !== null && !validator.setSchema(customVariables).validate(data).isValid()){
        throw new Error(`\r\n${validator.errorString}`);
    }
}).catch((error: Error) => {
    process.stderr.write(`${error.stack}\r\n`);
    isValid = false;
}).then(() => {
    process.exit(isValid ? 0 : 1);
});
