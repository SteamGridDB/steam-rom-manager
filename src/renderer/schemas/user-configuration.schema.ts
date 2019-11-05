import { availableProviders } from '../../lib/image-providers/available-providers';
import { availableParsers, availableParserInputs } from '../../lib/parsers/available-parsers';

export const userConfiguration = {
    type: 'object',
    properties: {
        version: { type: 'number' },
        parserType: { type: 'string', default: '', enum: availableParsers.concat('') },
        configTitle: { type: 'string', default: '' },
        steamCategory: { type: 'string', default: '' },
        executableLocation: { type: 'string', default: '' },
        executableModifier: { type: 'string', default: '"${exePath}"' },
        romDirectory: { type: 'string', default: '' },
        steamDirectory: { type: 'string', default: '' },
        startInDirectory: { type: 'string', default: '' },
        userAccounts: {
            type: 'object',
            default: {},
            properties: {
                skipWithMissingDataDir: { type: 'boolean', default: true },
                specifiedAccounts: { type: 'string', default: '' },
                useCredentials: { type: 'boolean', default: true }
            }
        },
        parserInputs: {
            type: 'object',
            default: {},
            propertyNames: {
                enum: availableParserInputs
            },
            patternProperties: {
                "^.+$": { "type": ["string", "null"] }
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
        executableArgs: { type: 'string', default: '' },
        appendArgsToExecutable: { type: 'boolean', default: true },
        imagePool: { type: 'string', default: '${fuzzyTitle}' },
        defaultImage: { type: 'string', default: '' },
        localImages: { type: 'string', default: '' },
        localTallImages: { type: 'string', default: '' },
        localIcons: { type: 'string', default: '' },
        onlineImageQueries: { type: 'string', default: '${${fuzzyTitle}}' },
        imageProviders: {
            type: 'array',
            default: <any>[],
            items: {
                oneOf: [
                    {
                        type: 'string',
                        enum: availableProviders
                    }
                ]
            }
        },
        titleModifier: { type: 'string', default: '${fuzzyTitle}' },
        fuzzyMatch: {
            type: 'object',
            default: {},
            properties: {
                use: { type: 'boolean', default: true },
                removeCharacters: { type: 'boolean', default: true },
                removeBrackets: { type: 'boolean', default: true },
                replaceDiacritics: { type: 'boolean', default: true }
            }
        },
        advanced: { type: 'boolean', default: false },
        disabled: { type: 'boolean', default: false },
    }
};
