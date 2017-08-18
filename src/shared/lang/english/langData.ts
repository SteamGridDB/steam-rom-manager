import { languageContainer } from "../../models";

export const EnglishLang: languageContainer = {
    'English': {
        preview: {
            component: {
                filter: 'Filter app titles',
                from: 'From',
                by: 'by',
                refresh: 'Refresh',
                retrievingUrls: 'Retrieving URLs',
                noImages: 'No images are available',
                downloadFailed: 'Download failed. Click to retry',
                downloadingImage: 'Downloading image',
                generateAppList: 'Generate app list',
                saveAppList: 'Save app list',
                removeAppList: 'Remove app list',
                remainingImages: 'Remaining provider instances:',
                stopUrlRetrieving: 'Stop image providers'
            },
            service: {
                info: {
                    listIsBeingGenerated: 'List is being generated. Please wait.',
                    listIsBeingSaved: 'List is being saved. Please wait.',
                    listIsBeingRemoved: 'List is being removed. Please wait.',
                    listIsEmpty: 'List is empty.',
                    populatingVDF_List: 'Populating VDF list.',
                    creatingBackups: 'Creating backups.',
                    readingVDF_Files: 'Reading VDF files.',
                    mergingVDF_entries: 'Merging VDF entries and replacing image files.',
                    removingVDF_entries: 'Removing VDF entries and image files.',
                    writingVDF_entries: 'Writing VDF files.',
                    updatingKnownSteamDirList: 'Updating a list of known Steam directories.',
                    retryingDownload__i: 'Retrying image download from "${imageUrl}" for "${appTitle}".',
                    disabledConfigurations__i: '${count} user configuration(s) was/were skipped (disabled by user).',
                    invalidConfigurations__i: '${count} user configuration(s) was/were skipped (invalid).',
                    executingParsers: 'Executing parsers.',
                    shutdownSteam: 'Please shutdown Steam before saving, otherwise it might not save correctly.',
                    noParserConfigurations: 'Please create parser configuration in "Parsers" menu first.',
                    parserFoundNoFiles: 'Parser(s) found no files matching user configuration.',
                    allImagesRetrieved: 'All available image urls retrieved.',
                    providerTimeout__i: 'Timeout was requested by "${provider}" for ${time} second(s).',
                    noAccountsWarning: 'User accounts not found. Incorrect Steam directory?'
                },
                errors: {
                    mergingVDF_entries: 'Error(s) occurred while merging VDF files or downloading images.',
                    readingVDF_entries: 'Error(s) occurred while reading VDF files.',
                    fatalError: 'Fatal error occurred. See event log for details.',
                    knownSteamDirListIsEmpty: 'A list of known Steam directories is empty.',
                    retryingDownload__i: 'Image download from "${imageUrl}" failed for "${appTitle}".',
                    providerError__i: 'Error received from "${provider}" for "${title}" (${url ? `${code}: ${url}` : code}).',
                    unknownProviderError__i: 'Unknown error received from "${provider}" for "${title}": ${error}'
                },
                success: {
                    writingVDF_entries: 'New entries saved/added.',
                    removingVDF_entries: 'Entries have been removed.',
                }
            }
        },
        globParser: {
            inputTitle: 'User\'s glob',
            docs__md: {
                self: [
                    require('./markdown/glob-parser.md'),
                    require('./markdown/what-is-glob.md'),
                    require('./markdown/spec-glob-chars.md'),
                ],
                input: [
                    require('./markdown/glob-parser-input.md'),
                    require('./markdown/spec-glob-chars.md')
                ]
            },
            errors: {
                noTitle: 'File glob must contain ${title}!',
                moreThanOneTitle: 'File glob must contain only one ${title}!',
                noStarNextToTitle: 'Star (*) can not be next to ${title}!',
                noAnyCharNextToTitle: 'Any char (?) can not be next to ${title}!',
                noWindowsSlash: 'Windows directory character (\\) is not allowed! Use "/" instead.',
                noGlobstarOnBothSides: 'Globstar (**) can only be on one side of ${title}!',
                noBracedDirSetOnBothSides: 'A braced set, containing at least one slash (/) can only be on one side of ${title}!',
                noBracedDirSetOrGlobstarOnBothSides: 'A braced set, containing at least one slash (/) and a globstar (**) can only be on one side of ${title}!',
                noEmptyPattern: 'Pattern can not be empty!',
                noEmptyCharRange: 'Character range can not be empty!',
                noStarInPatternNextToTitle: 'Star (*), inside a pattern, can not be next to ${title}!',
                noAnyCharInPatternNextToTitle: 'Any char (?), inside a pattern, can not be next to ${title}!'
            }
        },
        globRegexParser: {
            inputTitle: 'User\'s glob-regex',
            docs__md: {
                self: [
                    require('./markdown/glob-regex-parser.md'),
                    require('./markdown/what-is-glob.md'),
                    require('./markdown/spec-glob-chars.md')
                ],
                input: [
                    require('./markdown/glob-regex-parser-input.md'),
                    require('./markdown/spec-glob-chars.md')
                ]
            },
            errors: {
                noRegex: 'File glob must contain ${regex} where "regex" is your regular expression!',
                moreThanOneRegex: 'File glob must contain only one ${regex}!',
                noStarNextToRegex: 'Star (*) can not be next to ${regex}!',
                noAnyCharNextToRegex: 'Any char (?) can not be next to ${regex}!',
                noWindowsSlash: 'Windows directory character (\\) is not allowed! Use "/" instead.',
                noGlobstarOnBothSides: 'Globstar (**) can only be on one side of ${regex}!',
                noBracedDirSetOnBothSides: 'A braced set, containing at least one slash (/) can only be on one side of ${regex}!',
                noBracedDirSetOrGlobstarOnBothSides: 'A braced set, containing at least one slash (/) and a globstar (**) can only be on one side of ${regex}!',
                noEmptyPattern: 'Pattern can not be empty!',
                noEmptyCharRange: 'Character range can not be empty!',
                noStarInPatternNextToRegex: 'Star (*), inside a pattern, can not be next to ${regex}!',
                noAnyCharInPatternNextToRegex: 'Any char (?), inside a pattern, can not be next to ${regex}!'
            }
        },
        logger: {
            component: {
                noMessages: 'No messages are available',
                error: 'ERROR',
                info: 'INFO',
                success: 'SUCCESS',
                fuzzy: 'FUZZY',
                timestamp: 'TIMESTAMP',
                textWrap: 'TEXT-WRAP',
                autoscroll: 'AUTOSCROLL',
                clearLog: 'Clear log'
            }
        },
        settings: {
            component: {
                label: {
                    general: 'General settings',
                    imageProviders: 'Image provider settings',
                    fuzzy: 'Fuzzy matcher settings'
                },
                text: {
                    offlineMode: 'Offline mode',
                    removeApps_desc: 'Remove all added app entries:',
                    removeApps_btn: 'Remove!',
                    preloadImages: 'Preload retrieved images immediately',
                    fuzzy_verbose: 'Log matching results (logged results are hidden by default in Event log)',
                    fuzzy_filter: 'Filter images (tries to filter out unrelated images returned by some image providers)',
                    enabledProviders: 'Enabled providers:',
                    selectLanguage: 'Select language:',
                    resetFuzzy_desc: 'Reset fuzzy list:',
                    resetFuzzy_btn: 'Reset',
                    showSteamImages: 'Show current Steam images'
                },
                placeholder: {
                    noProviders: 'None'
                }
            },
            service: {
                error: {
                    writingError: 'Error occurred while saving user settings.',
                    readingError: 'Error occurred while reading user settings.'
                }
            }
        },
        nav: {
            component: {
                preview: 'Preview',
                logger: 'Event log',
                settings: 'Settings',
                parsers: 'Parsers',
                noTitle: 'No title!'
            }
        },
        parsers: {
            component: {
                buttons: {
                    save: 'Save',
                    copy: 'Copy',
                    testParser: 'Test parser',
                    delete: 'Delete',
                    moveUp: 'Move up',
                    moveDown: 'Move down',
                    faq: 'FAQ'
                },
                docs__md: {
                    intro: [require('./markdown/intro.md')],
                    faq: [require('./markdown/faq.md')],
                    parserType: [require('./markdown/empty-parser-type.md')],
                    configTitle: [require('./markdown/config-title.md')],
                    steamCategory: [require('./markdown/steam-category.md')],
                    executableLocation: [require('./markdown/executable-location.md')],
                    romDirectory: [require('./markdown/rom-directory.md')],
                    steamDirectory: [require('./markdown/steam-directory.md')],
                    userAccounts: [require('./markdown/user-accounts.md')],
                    titleModifier: [
                        require('./markdown/title-modifier.md'),
                        require('./markdown/what-is-app-id.md')
                    ],
                    fuzzyMatch: [require('./markdown/fuzzy-matching.md')],
                    executableArgs: [
                        require('./markdown/executable-arguments.md'),
                        require('./markdown/what-is-app-id.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    onlineImageQueries: [
                        require('./markdown/online-image-queries.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    imageProviders: [
                        require('./markdown/image-providers.md')
                    ],
                    localImages: [
                        require('./markdown/local-images.md'),
                        require('./markdown/special-glob-input.md'),
                        require('./markdown/parser-variables.md'),
                        require('./markdown/spec-glob-chars.md')
                    ],
                    localIcons: [
                        require('./markdown/local-icons.md'),
                        require('./markdown/special-glob-input.md'),
                        require('./markdown/parser-variables.md'),
                        require('./markdown/spec-glob-chars.md')
                    ]
                },
                info: {
                    testStarting__i: 'Testing "${title}" parser (SRM version - ${version}).',
                    testCompleted: 'Parser test is completed.',
                    nothingWasFound: 'Parser found nothing.'
                },
                error: {
                    missingAccounts__i: 'Following ${count} user account(s) were not found (user must to login to Steam at least once):',
                    missingAccountInfo__i: '  ${name}',
                    noAccountsWarning: 'Warning! No user accounts found, it could be due to one of the reasons below:\r\n - incorrect Steam directory;\r\n - no user has ever logged in;\r\n - Steam does not save user credentials ("Show advanced options -> User accounts -> Use account credentials").\r\nIf you\'re seeing this, preview won\'t be generated for this configuration.',
                    failedToMatch: 'Failed to match:',
                    failedFileInfo__i: '[${index}/${total}]: ${filename}',
                    testFailed: 'Testing failed',
                    cannotTestInvalid: 'Can not test invalid configuration!'
                },
                success: {
                    foundAccounts__i: 'Found ${count} available user account(s):',
                    foundAccountInfo__i: '  ${name} (steamID64: ${steamID64}, accountID: ${accountID})',
                    steamCategoriesResolved: 'Resolved Steam categories:',
                    steamCategoryInfo__i: '  ${steamCategory}',
                    extractedTitle__i: '[${index}/${total}]:               Title - ${title}',
                    fuzzyTitle__i: '[${index}/${total}]:         Fuzzy title - ${title}',
                    filePath__i: '[${index}/${total}]:           File path - ${filePath}',
                    completeShortcut__i: '[${index}/${total}]:   Complete shortcut - ${shortcut}',
                    firstImageQuery__i: '[${index}/${total}]:       Image queries - ${query}',
                    imageQueries__i: '[${index}/${total}]:                       ${query}',
                    resolvedImageGlob__i: '[${index}/${total}]: Resolved image glob:',
                    resolvedImageGlobInfo__i: '[${index}/${total}]:                       ${glob}',
                    localImagesResolved__i: '[${index}/${total}]:     Resolved images:',
                    localImageInfo__i: '[${index}/${total}]:                       ${image}',
                    resolvedIconGlob__i: '[${index}/${total}]:  Resolved icon glob:',
                    resolvedIconGlobInfo__i: '[${index}/${total}]:                       ${glob}',
                    localIconsResolved__i: '[${index}/${total}]:      Resolved icons:',
                    localIconInfo__i: '[${index}/${total}]:                       ${icon}'
                },
                label: {
                    parserType: 'Parser type',
                    configTitle: 'Configuration title',
                    steamCategory: 'Steam category',
                    executableLocation: 'Executable',
                    romDirectory: 'ROMs directory',
                    steamDirectory: 'Steam directory',
                    userAccounts: 'User accounts',
                    titleModifier: 'Title modifier',
                    fuzzyMatch: 'Fuzzy matching',
                    executableArgs: 'Command line arguments',
                    onlineImageQueries: 'Online image query',
                    imageProviders: 'Image providers',
                    localImages: 'Local images',
                    localIcons: 'Local icons'
                },
                placeholder: {
                    parserType: 'Select parser...',
                    imageProviders: 'None'
                },
                text: {
                    skipWithMissingDataDir: 'Skip found accounts with missing data directories',
                    useCredentials: 'Use account credentials',
                    fuzzy_use: 'Use fuzzy matching',
                    fuzzy_removeCharacters: 'Aggressive matching',
                    fuzzy_removeBrackets: 'Remove (...) and [...] brackets',
                    appendArgsToExecutable: 'Append arguments to executable',
                    disabled: 'Disable current parser',
                    advanced: 'Show advanced options',
                    noTitle: 'No title!'
                }
            },
            service: {
                error: {
                    savingConfiguration: 'Error encountered while saving user configurations!',
                    readingConfiguration: 'Error encountered while reading user configurations!',
                },
                validationErrors: {
                    parserType: 'Incorrect parser type!',
                    configTitle: 'Configuration title is required!',
                    parserInput: {
                        noInput: 'No inputs are available!',
                        inputNotAvailable__i: '"${name}" input is not available!',
                        incorrectParser: 'Incorrect parser!',
                    },
                    romDir: 'ROMs directory is invalid!',
                    steamDir: 'Steam directory is invalid!',
                    executable: 'Executable file is invalid!',
                    titleModifier: 'Title modifier must contain "${title}"',
                    variableString: 'Uneven number of "${" and "}" pairs. Use "\\" to escape "${" or "}" if you want to use them as characters.',
                    imageProviders: 'Incorrect image providers type!',
                    unhandledValidationKey: 'Input\'s validation is unhandled'
                },
                text: {
                    noTitle: 'No title!'
                }
            }
        },
        fuzzyMatcher: {
            info: {
                downloading: 'Title list for fuzzy matching will be downloaded.',
                successfulDownload: 'Download was successful. Saving list.',
                checkingIfListIsUpToDate: 'Checking if title list is up to date.',
                listIsOutdated: 'List is outdated. Title list for fuzzy matching will be downloaded.',
                listIsUpToDate: 'Title list is up to date.',
                match__i: 'Fuzzy title "${fuzzyTitle}" from "${extractedTitle}"',
                equal__i: 'Fuzzy compare: "${a}" == "${b}"',
                notEqual__i: 'Fuzzy compare: "${a}" != "${b}"'
            },
            error: {
                fatalError: 'Fatal error occurred while loading list for Fuzzy matcher. Fuzzy matching will be skipped.',
                totalGamesIsUndefined: 'Failed to get fuzzy list count. "totalGames" key is undefined.'
            }
        },
        fileParser: {
            error: {
                parserNotFound__i: 'Parser "${name}" not found!'
            }
        },
        imageProvider: {
            error: {
                webWorkerError__i: 'Web worker error has occurred. ${error}',
                unknownWebWorkerError: 'Unknown web worker error has occurred. Error data: ${data}',
            }
        },
        vdfManager: {
            error: {
                noUsersFound: 'None of the provided steam directories contained any user directory.',
                couldNotPopulateList__i: 'Could not populate VDF list. ${error}',
                emptyDirectoryList: 'Directory list is empty.',
                noUserIdsInDir__i: '"${steamDirectory}" contains no user ids.',
                readingVdf__i: 'Failed to read from "${filePath}". ${error}',
                writingVdf__i: 'Failed to write to "${filePath}". ${error}',
                creatingBackups__i: 'Could not create backups. ${error}',
                unsupportedMimeType__i: 'Mime type (${type}) is unsupported (title - "${title}").',
                imageError__i: 'Error occurred while downloading image for "${title}". ${error}',
                fatalImageError__i: 'Fatal error occurred while downloading image ("${title}": "${url}"). ${error}',
                couldNotMergeEntries__i: 'Could not merge entries and/or replace images. ${error}',
                couldNotRemoveEntries__i: 'Could not remove entries and/or replace images. ${error}'
            }
        }
    }
}