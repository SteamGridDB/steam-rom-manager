import { languageManager } from '../../shared/lib/language-manager';
import { availableProviders } from "../lib/image-providers";

export const appSettings = {
    type: 'object',
    properties: {
        fuzzyMatcher: {
            type: 'object',
            default: {},
            properties: {
                timestamps: {
                    type: 'object',
                    default: {},
                    properties: {
                        check: { type: 'number', default: 0 },
                        download: { type: 'number', default: 0 }
                    }
                },
                verbose: { type: 'boolean', default: false },
                filterProviders: { type: 'boolean', default: true }
            }
        },
        previewSettings: {
            type: 'object',
            default: {},
            properties: {
                retrieveCurrentSteamImages: { type: 'boolean', default: true },
                imageZoomPercentage: { type: 'number', default: 40, minimum: 30, maximum: 100 },
                preload: { type: 'boolean', default: false },
            }
        },
        enabledProviders: {
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
        language: { type: 'string', default: languageManager.getDefaultLanguage(), enum: languageManager.getAvailableLanguages() },
        offlineMode: { type: 'boolean', default: false },
        knownSteamDirectories: {
            type: 'array',
            default: <any>[],
            items: { type: 'string' }
        }
    }
};