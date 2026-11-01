import { userConfiguration } from "./user-configuration.schema";
import { cloneDeep } from "lodash";

export const configPresets = {
  type: "object",
  patternProperties: {
    "^.+$": (() => {
      let configOptions = cloneDeep(userConfiguration);
      configOptions["oneOf"].map((config) => {
        delete config.properties.version;
        delete config.properties.parserId;
        config.properties["presetVersion"] = { type: "number" };
      });
      let addStrictValidation = (data: any) => {
        if (data["type"] === "object") {
          if (data["oneOf"] !== undefined) {
            for (let i = 0; i < data["oneOf"].length; i++) {
              addStrictValidation(data["oneOf"][i]);
            }
          } else if (data["properties"] !== undefined) {
            const keys = Object.keys(data["properties"]);

            data["required"] = keys;
            data["additionalProperties"] = false;

            for (const key of keys) {
              addStrictValidation(data["properties"][key]);
            }
          } else if (
            data["propertyNames"] !== undefined &&
            data["propertyNames"]["enum"] !== undefined
          ) {
            data["required"] = data["propertyNames"]["enum"];
          }
        }
      };
      addStrictValidation(configOptions);

      return configOptions;
    })(),
  },
};
