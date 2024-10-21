import {
  onlineProviders,
  providerInfo,
} from "../../lib/image-providers/available-providers";
import {
  availableParsers,
  availableParserInputs,
} from "../../lib/parsers/available-parsers";
import { ParserInputField, ParserInputType, ParserType } from "../../models";
import { cloneDeep, union } from "lodash";
import {parsers} from "../../lib/parsers/";

const sharedProperties = {
  properties: {
    version: { type: "number" },
    configTitle: { type: "string", default: "" },
    parserId: { type: "string", default: "" },
    steamCategories: {
      type: "array",
      default: [] as string[],
      items: { type: "string" },
    },
    executable: {
      type: "object",
      default: {},
      properties: {
        path: { type: "string", default: "" },
        shortcutPassthrough: { type: "boolean", default: false },
        appendArgsToExecutable: { type: "boolean", default: false },
      },
    },
    executableArgs: { type: "string", default: "" },
    executableModifier: { type: "string", default: "" },
    romDirectory: { type: "string", default: "" },
    steamDirectory: { type: "string", default: "${steamdirglobal}" },
    startInDirectory: { type: "string", default: "" },
    userAccounts: {
      type: "object",
      default: {},
      properties: {
        specifiedAccounts: {
          type: "array",
          default: ["Global"],
          items: {
            type: "string",
          },
        },
      },
    },
    titleFromVariable: {
      type: "object",
      default: {},
      properties: {
        limitToGroups: { type: "string", default: "" },
        skipFileIfVariableWasNotFound: { type: "boolean", default: false },
        caseInsensitiveVariables: { type: "boolean", default: false },
      },
    },
    imagePool: { type: "string", default: "${fuzzyTitle}" },
    drmProtect: { type: "boolean", default: false },
    defaultImage: {
      type: "object",
      default: {},
    },
    localImages: {
      type: "object",
      default: {},
    },
    onlineImageQueries: { type: "string", default: "${${fuzzyTitle}}" },
    imageProviders: {
      type: "array",
      default: onlineProviders,
      items: {
        oneOf: [
          {
            type: "string",
            enum: onlineProviders,
          },
        ],
      },
    },
    imageProviderAPIs: {
      type: "object",
      default: {},
      properties: {
        sgdb: {
          type: "object",
          default: {},
          properties: {
            nsfw: { type: "boolean", default: false },
            humor: { type: "boolean", default: false },
            styles: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.styles.allowedValues,
                  },
                ],
              },
            },
            stylesHero: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.stylesHero.allowedValues,
                  },
                ],
              },
            },
            stylesLogo: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.stylesLogo.allowedValues,
                  },
                ],
              },
            },
            stylesIcon: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.stylesIcon.allowedValues,
                  },
                ],
              },
            },
            imageMotionTypes: {
              type: "array",
              default: ["static"],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.imageMotionTypes
                      .allowedValues,
                  },
                ],
              },
            },
            sizes: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.sizes.allowedValues,
                  },
                ],
              },
            },
            sizesHero: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.sizesHero.allowedValues,
                  },
                ],
              },
            },
            sizesIcon: {
              type: "array",
              default: [] as string[],
              items: {
                oneOf: [
                  {
                    type: "string",
                    enum: providerInfo.sgdb.inputs.sizesIcon.allowedValues,
                  },
                ],
              },
            },
          },
        },
      },
    },
    titleModifier: { type: "string", default: "" },
    fuzzyMatch: {
      type: "object",
      default: {},
      properties: {
        removeCharacters: { type: "boolean", default: true },
        removeBrackets: { type: "boolean", default: true },
        replaceDiacritics: { type: "boolean", default: true },
      },
    },
    steamInputEnabled: { type: "string", default: "1", enum: ["0", "1", "2"] },
    controllers: {
      type: "object",
      default: {},
      patternProperties: {
        "^.+$": {
          anyOf: [
            {
              type: "object",
              default: { title: "", mappingId: "", profileType: "" },
              properties: {
                title: { type: "string", default: "" },
                mappingId: { type: "string", default: "" },
                profileType: { type: "string", default: "" },
              },
            },
            { type: "null" },
          ],
        },
      },
    },
    disabled: { type: "boolean", default: false },
  },
};
let convertToSchema = (inputType: ParserInputType) => {
  if(["text","path","dir"].includes(inputType)) {
    return {"type": ["string", "null"], default: ""}
  }
  else if(inputType=="toggle"){
    return {"type": ["boolean", "null"], default: false}
  }
  else if(inputType=="multiselect"){
    return {"type": "array", default: [] as string[]}
  }
}
let options: any[] = availableParsers.map((parserType: ParserType) => {
  let temp = cloneDeep(sharedProperties);
  let inputInfo = parsers[parserType].getParserInfo().inputs||{};
  if (availableParserInputs[parserType].length) {
    Object.assign(temp.properties, {
      parserType: { type: "string", default: "", enum: [parserType, ""] },
      parserInputs: {
        type: "object",
        default: {},
        properties: Object.fromEntries(availableParserInputs[parserType].map(inputName=>{ return [
          inputName,
          convertToSchema(inputInfo[inputName].inputType)
        ]}))
      },
    });
  } else {
    Object.assign(temp.properties, {
      parserType: { type: "string", default: "", enum: [parserType, ""] },
      parserInputs: {
        type: "object",
        default: {},
        patternProperties: {
          "^.+$": { type: ["string", "null"] },
        },
      },
    });
  }
  return temp;
});
export const userConfiguration = {
  type: "object",
  oneOf: options,
};
console.log("userConfiguration Schema", userConfiguration)


export const defaultUserConfiguration = options[0];
