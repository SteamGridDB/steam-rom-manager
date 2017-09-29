import { availableProviders } from '../lib/image-providers';
import { availableParsers, availableParserInputs } from '../lib/parsers';

export const userConfiguration = {
    type: 'object',
    properties: {
        version: { type: 'number' },
        parserType: { type: 'string', default: '', enum: availableParsers().concat('') },
        configTitle: { type: 'string', default: '' },
        steamCategory: { type: 'string', default: '' },
        executableLocation: { type: 'string', default: '' },
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
                enum: availableParserInputs()
            },
            patternProperties: {
                "^.+$": { "type": ["string", "null"] }
            }
        },
        executableArgs: { type: 'string', default: '' },
        appendArgsToExecutable: { type: 'boolean', default: false },
        imagePool: { type: 'string', default: '${fuzzyTitle}' },
        localImages: { type: 'string', default: '' },
        localIcons: { type: 'string', default: '' },
        onlineImageQueries: { type: 'string', default: '${${fuzzyTitle}}' },
        imageProviders: {
            type: 'array',
            default: <any>[],
            items: {
                oneOf: [
                    {
                        type: 'string',
                        enum: availableProviders()
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
                removeBrackets: { type: 'boolean', default: true }
            }
        },
        advanced: { type: 'boolean', default: false },
        disabled: { type: 'boolean', default: false },
    }
};