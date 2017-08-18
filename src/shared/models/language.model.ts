export interface languageStruct {
    preview: {
        component: {
            filter: string,
            from: string,
            by: string,
            refresh: string,
            retrievingUrls: string,
            noImages: string,
            downloadFailed: string,
            downloadingImage: string,
            generateAppList: string,
            saveAppList: string,
            removeAppList: string,
            remainingImages: string,
            stopUrlRetrieving: string
        },
        service: {
            info: {
                listIsBeingGenerated: string,
                listIsBeingSaved: string,
                listIsBeingRemoved: string,
                listIsEmpty: string
                populatingVDF_List: string,
                creatingBackups: string,
                readingVDF_Files: string,
                mergingVDF_entries: string,
                removingVDF_entries: string,
                writingVDF_entries: string,
                updatingKnownSteamDirList: string,
                retryingDownload__i: string, //${imageUrl}, ${appTitle}
                disabledConfigurations__i: string, //${count}
                invalidConfigurations__i: string, //${count}
                executingParsers: string,
                shutdownSteam: string,
                noParserConfigurations: string,
                parserFoundNoFiles: string,
                allImagesRetrieved: string,
                providerTimeout__i: string,//${provider}, ${time}
                noAccountsWarning: string
            },
            errors: {
                mergingVDF_entries: string,
                readingVDF_entries: string,
                fatalError: string,
                knownSteamDirListIsEmpty: string,
                retryingDownload__i: string //${imageUrl}, ${appTitle},
                providerError__i: string//${provider}, ${code}, ${title}, ${url}
                unknownProviderError__i: string //${provider}, ${title}, ${error}
            },
            success: {
                writingVDF_entries: string,
                removingVDF_entries: string
            }
        }
    },
    globParser: {
        inputTitle: string,
        docs__md: {
            self: string[],
            input: string[]
        },
        errors: {
            noTitle: string,
            moreThanOneTitle: string,
            noStarNextToTitle: string,
            noAnyCharNextToTitle: string,
            noWindowsSlash: string,
            noGlobstarOnBothSides: string,
            noBracedDirSetOnBothSides: string,
            noBracedDirSetOrGlobstarOnBothSides: string,
            noEmptyPattern: string,
            noEmptyCharRange: string,
            noStarInPatternNextToTitle: string,
            noAnyCharInPatternNextToTitle: string
        }
    },
    globRegexParser: {
        inputTitle: string,
        docs__md: {
            self: string[],
            input: string[]
        },
        errors: {
            noRegex: string,
            moreThanOneRegex: string,
            noStarNextToRegex: string,
            noAnyCharNextToRegex: string,
            noWindowsSlash: string,
            noGlobstarOnBothSides: string,
            noBracedDirSetOnBothSides: string,
            noBracedDirSetOrGlobstarOnBothSides: string,
            noEmptyPattern: string,
            noEmptyCharRange: string,
            noStarInPatternNextToRegex: string,
            noAnyCharInPatternNextToRegex: string
        }
    },
    logger: {
        component: {
            noMessages: string,
            error: string,
            info: string,
            success: string,
            fuzzy: string,
            timestamp: string,
            textWrap: string,
            autoscroll: string,
            clearLog: string
        }
    },
    settings: {
        component: {
            label: {
                general: string,
                imageProviders: string,
                fuzzy: string
            },
            text: {
                offlineMode: string,
                removeApps_desc: string,
                removeApps_btn: string,
                preloadImages: string,
                fuzzy_verbose: string,
                fuzzy_filter: string,
                enabledProviders: string,
                selectLanguage: string,
                resetFuzzy_desc: string,
                resetFuzzy_btn: string,
                showSteamImages: string
            },
            placeholder: {
                noProviders: string
            }
        },
        service: {
            error: {
                writingError: string
                readingError: string
            }
        }
    },
    nav: {
        component: {
            preview: string,
            logger: string,
            settings: string,
            parsers: string,
            noTitle: string
        }
    },
    parsers: {
        component: {
            buttons: {
                save: string,
                copy: string,
                testParser: string,
                delete: string,
                moveUp: string,
                moveDown: string,
                faq: string
            },
            docs__md: {
                intro: string[],
                faq: string[],
                parserType: string[],
                configTitle: string[],
                steamCategory: string[],
                executableLocation: string[],
                romDirectory: string[],
                steamDirectory: string[],
                userAccounts: string[],
                titleModifier: string[],
                fuzzyMatch: string[],
                executableArgs: string[],
                onlineImageQueries: string[],
                imageProviders: string[],
                localImages: string[],
                localIcons: string[]
            },
            info: {
                testStarting__i: string, //${title}, ${version}
                testCompleted: string,
                nothingWasFound: string,
            }
            error: {
                missingAccounts__i: string, //${count}
                missingAccountInfo__i: string, //${name}
                noAccountsWarning: string,
                failedToMatch: string,
                failedFileInfo__i: string, //${index}, ${total}, ${filename}
                testFailed: string,
                cannotTestInvalid: string
            }
            success: {
                foundAccounts__i: string, //${count}
                foundAccountInfo__i: string, //${name}, ${steamID64}, ${accountID}
                steamCategoriesResolved: string,
                steamCategoryInfo__i: string, //${steamCategory}
                extractedTitle__i: string, //${index}, ${total}, ${title}
                fuzzyTitle__i: string, //${index}, ${total}, ${title}
                filePath__i: string, //${index}, ${total}, ${filePath}
                completeShortcut__i: string, //${index}, ${total}, ${shortcut}
                firstImageQuery__i: string, //${index}, ${total}, ${query}
                imageQueries__i: string, //${index}, ${total}, ${query}
                resolvedImageGlob__i: string, //${index}, ${total}
                resolvedImageGlobInfo__i: string, //${index}, ${total}, ${glob}
                localImagesResolved__i: string, //${index}, ${total}
                localImageInfo__i: string//${index}, ${total}, ${image},
                resolvedIconGlob__i: string, //${index}, ${total}
                resolvedIconGlobInfo__i: string, //${index}, ${total}, ${glob}
                localIconsResolved__i: string, //${index}, ${total}
                localIconInfo__i: string, //${index}, ${total}, ${icon}
            },
            label: {
                parserType: string,
                configTitle: string,
                steamCategory: string,
                executableLocation: string,
                romDirectory: string,
                steamDirectory: string,
                userAccounts: string,
                titleModifier: string,
                fuzzyMatch: string,
                executableArgs: string,
                onlineImageQueries: string,
                imageProviders: string,
                localImages: string,
                localIcons: string
            },
            placeholder: {
                parserType: string,
                imageProviders: string
            },
            text: {
                skipWithMissingDataDir: string,
                useCredentials: string,
                fuzzy_use: string,
                fuzzy_removeCharacters: string,
                fuzzy_removeBrackets: string,
                appendArgsToExecutable: string,
                disabled: string,
                advanced: string,
                noTitle: string
            }
        },
        service: {
            error: {
                savingConfiguration: string,
                readingConfiguration: string,
            },
            validationErrors: {
                parserType: string,
                configTitle: string,
                parserInput: {
                    noInput: string,
                    inputNotAvailable__i: string,//${name}
                    incorrectParser: string,
                },
                romDir: string,
                steamDir: string,
                executable: string
                titleModifier: string,
                variableString: string,
                imageProviders: string,
                unhandledValidationKey: string
            },
            text: {
                noTitle: string
            }
        }
    },
    fuzzyMatcher: {
        info: {
            downloading: string,
            successfulDownload: string,
            checkingIfListIsUpToDate: string,
            listIsOutdated: string,
            listIsUpToDate: string,
            match__i: string, //${fuzzyTitle}, ${extractedTitle}
            equal__i: string, //${a}, ${b}
            notEqual__i: string //${a}, ${b}
        },
        error: {
            fatalError: string,
            totalGamesIsUndefined: string
        }
    },
    fileParser: {
        error: {
            parserNotFound__i: string //${name}
        }
    },
    imageProvider: {
        error: {
            webWorkerError__i: string, //${error}
            unknownWebWorkerError: string, //${data}
        }
    },
    vdfManager: {
        error: {
            noUsersFound: string,
            couldNotPopulateList__i: string, //${error}
            emptyDirectoryList: string,
            noUserIdsInDir__i: string,  //${steamDirectory}
            readingVdf__i: string, //${filePath}, ${error}
            writingVdf__i: string, //${filePath}, ${error}
            creatingBackups__i: string, //${error}
            unsupportedMimeType__i: string, //${type}, ${title}
            imageError__i: string, //${title}, ${error}
            fatalImageError__i: string, //${title}, ${url}, ${error}
            couldNotMergeEntries__i: string, //${error}
            couldNotRemoveEntries__i: string //${error}
        }
    }
}

export interface languageContainer {
    [language: string]: languageStruct
}