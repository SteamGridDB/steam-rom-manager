import * as modifiers from "../src/renderer/modifiers/config-presets.modifier";
import * as json from "../src/lib/helpers/json";
import * as glob from "glob";
import { configPresets } from "../src/renderer/schemas/config-presets.schema";
// Used for updating config presets en masse via new schema
let isValid = true;
const validator = new json.Validator(undefined, modifiers.configPreset, {
  useDefaults: false,
});
let presetFiles: string[] = glob.sync("./files/presets/*.json");
let presetPromises: Promise<object | void>[] = [];
for (let i = 0; i < presetFiles.length; i++) {
  presetPromises.push(
    json.read(presetFiles[i]).then((data: { [key: string]: any } | void) => {
      if (data) {
        for (let key of Object.keys(data)) {
          if (
            data[key] !== null &&
            !validator.validate(data[key] || {}).isValid()
          ) {
            throw new Error(`\r\n${validator.errorString}`);
          } else {
          }
        }
        console.log(presetFiles[i], "\n:::\n", data);
        return json.write(presetFiles[i], data);
      } else {
        return Promise.resolve();
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
    console.log(isValid ? "Valid" : "Invalid");
    process.exit(isValid ? 0 : 1);
  });
