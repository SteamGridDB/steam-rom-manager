import { configPresets } from "../src/renderer/schemas/config-presets.schema";
import { customVariables } from "../src/renderer/schemas/custom-variables.schema";
import * as json from "../src/lib/helpers/json";
import * as glob from "glob";

let isValid = true;
const validator = new json.Validator(undefined, undefined, {
  useDefaults: false,
});
let presetFiles: string[] = glob.sync("./files/presets/*.json");
let presetPromises: Promise<object | void>[] = [];
for (let i = 0; i < presetFiles.length; i++) {
  presetPromises.push(
    json.read(presetFiles[i]).then((data: object | void) => {
      if (
        data !== null &&
        !validator
          .setSchema(configPresets)
          .validate(data || {})
          .isValid()
      ) {
        throw new Error(`\r\n${validator.errorString}`);
      }
    }),
  );
}
Promise.all(presetPromises)
  .catch((error: Error) => {
    process.stderr.write(`${error.stack}\r\n`);
    isValid = false;
  })
  .then(() => {
    return json.read("./files/customVariables.json");
  })
  .then((data: object) => {
    if (
      data !== null &&
      !validator.setSchema(customVariables).validate(data).isValid()
    ) {
      throw new Error(`\r\n${validator.errorString}`);
    }
  })
  .catch((error: Error) => {
    process.stderr.write(`${error.stack}\r\n`);
    isValid = false;
  })
  .then(() => {
    console.log(isValid ? "Valid" : "Invalid");
    process.exit(isValid ? 0 : 1);
  });
