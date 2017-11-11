import { languageContainer } from "../../models";

export const EnglishLang: languageContainer = {
    'English': {
        about: {
            component: {
                info__md: [require('./markdown/about.md')]
            }
        },
        preview: {
            component: {
                filter: 'Filter app titles',
                by: 'by',
                refreshImages: 'Refresh images',
                addLocalImages: 'Add local images',
                retryDownload: 'Retry download',
                generateAppList: 'Generate app list',
                saveAppList: 'Save app list',
                removeAppList: 'Remove app list',
                remainingImages: 'Remaining providers:',
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
                    shutdownSteam: 'Please shutdown Steam if it is running.',
                    noParserConfigurations: 'Please create parser configuration in "Parsers" menu first.',
                    parserFoundNoFiles: 'Parser(s) found no files matching user configuration.',
                    allImagesRetrieved: 'All available image urls retrieved.',
                    providerTimeout__i: 'Timeout was requested by "${provider}" for ${time} second(s).',
                    noAccountsWarning: 'User accounts not found. Incorrect Steam directory?'
                },
                errors: {
                    populatingVDF_entries: 'Non-fatal error(-s) occurred populating VDF entries.',
                    savingVDF_entries: 'Non-fatal error(-s) occurred while saving VDF/image files.',
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
                noTitle__md: '> File glob must contain `${title}`!',
                moreThanOneTitle__md: '> File glob must contain only one `${title}`!',
                noStarNextToTitle__md: '> Star `*` can not be next to `${title}`!',
                noAnyCharNextToTitle__md: '> Any char `?` can not be next to `${title}`!',
                noWindowsSlash__md: '> Windows directory character `\\` is not allowed! Use `/` instead.',
                noGlobstarOnBothSides__md: '> Globstar `**` can only be on one side of `${title}`!',
                noBracedDirSetOnBothSides__md: '> A braced set, containing at least one slash `/` can only be on one side of `${title}`!',
                noBracedDirSetOrGlobstarOnBothSides__md: '> A braced set, containing at least one slash `/` and a globstar `**` can only be on one side of `${title}`!',
                noEmptyPattern__md: '> Pattern can not be empty!',
                noEmptyCharRange__md: '> Character range can not be empty!',
                noStarInPatternNextToTitle__md: '> Star `*`, inside a pattern, can not be next to `${title}`!',
                noAnyCharInPatternNextToTitle__md: '> Any char `?`, inside a pattern, can not be next to `${title}`!'
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
                noRegex__md: '> File glob must contain `${regex}` where **regex** is your regular expression!',
                moreThanOneRegex__md: '> File glob must contain only one `${regex}`!',
                noStarNextToRegex__md: '> Star `*` can not be next to `${regex}`!',
                noAnyCharNextToRegex__md: '> Any char `?` can not be next to `${regex}`!',
                noWindowsSlash__md: '> Windows directory character `\\` is not allowed! Use `/` instead.',
                noGlobstarOnBothSides__md: '> Globstar `**` can only be on one side of `${regex}`!',
                noBracedDirSetOnBothSides__md: '> A braced set, containing at least one slash `/` can only be on one side of `${regex}`!',
                noBracedDirSetOrGlobstarOnBothSides__md: '> A braced set, containing at least one slash `/` and a globstar `**` can only be on one side of `${regex}`!',
                noEmptyPattern__md: '> Pattern can not be empty!',
                noEmptyCharRange__md: '> Character range can not be empty!',
                noStarInPatternNextToRegex__md: '> Star `*`, inside a pattern, can not be next to `${regex}`!',
                noAnyCharInPatternNextToRegex__md: '> Any char `?`, inside a pattern, can not be next to `${regex}`!'
            }
        },
        logger: {
            component: {
                noMessages: 'No messages are available',
                error: 'ERROR',
                info: 'INFO',
                success: 'SUCCESS',
                fuzzy: 'FUZZY',
                textWrap: 'TEXT-WRAP',
                autoscroll: 'AUTOSCROLL',
                clearLog: 'Clear log'
            }
        },
        customVariables: {
            service: {
                error: {
                    writingError: 'Error occurred while saving custom variables.',
                    readingError: 'Error occurred while reading custom variables.',
                    corruptedVariables__i: 'Saved custom variables are invalid!\r\nPermanent variable saving is disabled until this issue is resolved.\r\nTry to manually fix errors yourself (file - ${file})\r\nor seek help on github or our official discord channel: ${error}',
                }
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
                    showSteamImages: 'Show current Steam images',
                    clearLogOnTest: 'Automatically clear log when before testing parser'
                },
                placeholder: {
                    noProviders: 'None'
                }
            },
            service: {
                error: {
                    writingError: 'Error occurred while saving user settings.',
                    readingError: 'Error occurred while reading user settings.',
                    corruptedSettings__i: 'Saved app settings are invalid!\r\nPermanent settings saving is disabled until this issue is resolved.\r\nTry to manually fix errors yourself (file - ${file})\r\nor seek help on github or our official discord channel: ${error}',
                }
            }
        },
        nav: {
            component: {
                about: 'About',
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
                    faq: 'FAQ',
                    undoChanges: 'Undo changes',
                    undoDelete: 'Undo delete'
                },
                docs__md: {
                    intro: [require('./markdown/intro.md')],
                    faq: [require('./markdown/faq.md')],
                    parserType: [require('./markdown/empty-parser-type.md')],
                    configTitle: [require('./markdown/config-title.md')],
                    steamCategory: [
                        require('./markdown/steam-category.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    executableLocation: [require('./markdown/executable-location.md')],
                    romDirectory: [require('./markdown/rom-directory.md')],
                    steamDirectory: [require('./markdown/steam-directory.md')],
                    startInDirectory: [require('./markdown/start-in-directory.md')],
                    userAccounts: [require('./markdown/user-accounts.md')],
                    titleModifier: [
                        require('./markdown/title-modifier.md'),
                        require('./markdown/what-is-app-id.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    titleFromVariable: [
                        require('./markdown/title-from-variable.md')
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
                    imagePool: [
                        require('./markdown/image-pool.md'),
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
                    steamCategory__i: '[${index}/${total}]:    Steam categories - ${steamCategory}',
                    steamCategoryInfo__i: '[${index}/${total}]:                       ${steamCategory}',
                    extractedTitle__i: '[${index}/${total}]:               Title - ${title}',
                    fuzzyTitle__i: '[${index}/${total}]:         Fuzzy title - ${title}',
                    finalTitle__i: '[${index}/${total}]:         Final title - ${title}',
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
                    startInDirectory: '"Start In" directory',
                    userAccounts: 'User accounts',
                    titleFromVariable: 'Title from custom variable',
                    titleModifier: 'Title modifier',
                    fuzzyMatch: 'Fuzzy matching',
                    executableArgs: 'Command line arguments',
                    onlineImageQueries: 'Online image query',
                    imagePool: 'Image pool',
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
                    tryToMatchTitle: 'Enabled',
                    skipFileIfVariableWasNotFound: 'Skip file if variable was not found',
                    caseInsensitiveVariables: 'Case-insensitive variables',
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
                    corruptedConfiguration__i: 'One or more saved parser configurations are invalid!\r\nPermanent configuration saving is disabled until this issue is resolved.\r\nTry to manually fix errors yourself (file - ${file})\r\nor seek help on github or our official discord channel: ${error}',
                },
                validationErrors: {
                    parserType__md: '> Incorrect parser type!',
                    configTitle__md: '> Configuration title is required!',
                    parserInput: {
                        noInput: 'No inputs are available!',
                        inputNotAvailable__i: '"${name}" input is not available!',
                        incorrectParser: 'Incorrect parser!',
                    },
                    romDir__md: '> ROMs directory is invalid!',
                    steamDir__md: '> Steam directory is invalid!',
                    startInDir__md: '> "Start In" directory is invalid!',
                    executable__md: '> Executable file is invalid!',
                    imagePool__md: '> Image pool must not be empty!',
                    titleModifier__md: '> Title modifier must not be empty!',
                    variableString__md: '> Uneven number of `${` and `}` pairs. Use `\\` to escape `${` or `}` if you want to use them as characters.',
                    imageProviders__md: '> Incorrect image providers type!',
                    unhandledValidationKey__md: '> Input\'s validation is unhandled'
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
                parserNotFound__i: 'Parser "${name}" not found!',
                tooManyFieldGlobs__md: '> Only one `$(...)$` set is allowed per input.',
                parserIsRequired__md: '> First part of `$(...)$` must contain a valid **Glob** ir **Glob-regex** field.',
                noWinSlashes__md: '> Windows directory character `\\` is not allowed! Use `/` instead.'
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
                emptyDirectoryList: 'Directory list is empty.',
                couldNotMergeEntries__i: 'Could not merge entries. ${error}',
                couldNotRemoveEntries__i: 'Could not remove entries. ${error}'
            }
        },
        vdfFile: {
            error: {
                readingVdf__i: 'Failed to read from "${filePath}". ${error}',
                writingVdf__i: 'Failed to write to "${filePath}". ${error}',
                creatingBackup__i: 'Could not create backup for "${filePath}". ${error}',
                unsupportedMimeType__i: 'Mime type (${type}) is unsupported (title - "${title}").',
                imageError__i: 'Error occurred while saving/downloading image for "${title}". Url: ${url}. ${error}'
            }
        },
        helpers: {
            error: {
                noUserIdsInDir__i: '"${steamDirectory}" contains no user ids.'
            }
        }
    }
}