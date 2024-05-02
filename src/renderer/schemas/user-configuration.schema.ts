import { availableProviders, defaultProviders, providerInfo } from '../../lib/image-providers/available-providers';
import { availableParsers, availableParserInputs } from '../../lib/parsers/available-parsers';
import { ParserType } from "../../models";
import { cloneDeep, union } from "lodash";

const sharedProperties = {
  properties: {
    version: { type: 'number' },
    configTitle: { type: 'string', default: '' },
    parserId: { type: 'string', default: '' },
    steamCategory: { type: 'string', default: '' },
    executable: {
      type: 'object',
      default: {},
      properties:{
        path: {type: 'string', default: ''},
        shortcutPassthrough: {type: 'boolean', default: false },
        appendArgsToExecutable: { type: 'boolean', default: true },
      }
    },
    executableArgs: { type: 'string', default: '' },
    executableModifier: { type: 'string', default: '"${exePath}"' },
    romDirectory: { type: 'string', default: '' },
    steamDirectory: { type: 'string', default: '' },
    startInDirectory: { type: 'string', default: '' },
    userAccounts: {
      type: 'object',
      default: {},
      properties: {
        specifiedAccounts: { type: 'string', default: '' },
      }
    },
    titleFromVariable: {
      type: 'object',
      default: {},
      properties: {
        limitToGroups: { type: 'string', default: '' },
        skipFileIfVariableWasNotFound: { type: 'boolean', default: false },
        caseInsensitiveVariables: { type: 'boolean', default: false },
        tryToMatchTitle: { type: 'boolean', default: false }
      }
    },
    imagePool: { type: 'string', default: '${fuzzyTitle}' },
    drmProtect: { type: 'boolean', default: false },
    defaultImage: {
      type: 'object',
      default: {},
    },
    localImages: {
      type: 'object',
      default: {},
    },
    onlineImageQueries: { type: 'string', default: '${${fuzzyTitle}}' },
    imageProviders: {
      type: 'array',
      default: defaultProviders,
      items: {
        oneOf: [
          {
            type: 'string',
            enum: availableProviders
          }
        ]
      }
    },
    imageProviderAPIs: {
      type: 'object',
      default: {},
      properties: {
        SteamGridDB: {
          type: 'object',
          default: {},
          properties: {
            nsfw: {type: 'boolean', default: false},
            humor: {type: 'boolean', default: false},
            styles: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.styles.allowedValues}
                ]
              }
            },
            stylesHero: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.stylesHero.allowedValues}
                ]
              }
            },
            stylesLogo: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.stylesLogo.allowedValues}
                ]
              }
            },
            stylesIcon: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.stylesIcon.allowedValues}
                ]
              }
            },
            imageMotionTypes: {
              type: 'array',
              default: ['static'],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.imageMotionTypes.allowedValues}
                ]
              }
            },
            sizes: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.sizes.allowedValues}
                ]
              }
            },
            sizesHero: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.sizesHero.allowedValues}
                ]
              }
            },
            sizesIcon: {
              type: 'array',
              default: [] as string[],
              items: {
                oneOf: [
                  {type: 'string', enum: providerInfo.SteamGridDB.inputs.sizesIcon.allowedValues}
                ]
              }
            },
          }
        }
      }
    },
    titleModifier: { type: 'string', default: '${fuzzyTitle}' },
    fuzzyMatch: {
      type: 'object',
      default: {},
      properties: {
        removeCharacters: { type: 'boolean', default: true },
        removeBrackets: { type: 'boolean', default: true },
        replaceDiacritics: { type: 'boolean', default: true }
      }
    },
    steamInputEnabled: { type: 'string', default: '1', enum: ['0','1','2'] },
    controllers: {
      type: 'object',
      default: {},
      patternProperties: {
        "^.+$": {
          anyOf: [
            {
              type: 'object',
              default: { title: "", mappingId: "", profileType: "" },
              properties: {
                title: { type: 'string', default: '' },
                mappingId: { type: 'string', default: '' },
                profileType: { type: 'string', default: '' }
              }
            },
            { type: 'null' }
          ]
        }
      }
    },
    disabled: { type: 'boolean', default: false },
  }
}

let options: any[] = availableParsers.map((parserType: ParserType)=>{
  let temp = cloneDeep(sharedProperties);
  if(availableParserInputs[parserType].length) {
    Object.assign(temp.properties, {
      parserType: {type: 'string', default: '',enum: [parserType,'']},
      parserInputs: {
        type: 'object',
        default: {},
        propertyNames: {
          enum: availableParserInputs[parserType]
        },
        patternProperties: {
          "^.+$": { "type": ["string","boolean", "null"] }
        }
      }
    });
  } else {
    Object.assign(temp.properties, {
      parserType: {type: 'string', default: '', enum: [parserType,'']},
      parserInputs: {
        type: 'object',
        default: {},
        patternProperties: {
          "^.+$": { "type": ["string", "null"] }
        }
      }
    })
  }
  return temp
})

export const userConfiguration = {
  type: 'object',
  oneOf: options
};

export const defaultUserConfiguration = options[0];
