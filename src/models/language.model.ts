export interface languageStruct {
  about: {
    component: {
      info__md: string[]
    }
  },
  parsersList: {
    component: {
      info__md: string[]
    }
  },
  preview: {
    component: {
      filter: string,
      selectType: string,
      selectCategories: string,
      selectParsers: string,
      selectTypeOptions: {
        long: string,
        tall: string,
        hero: string,
        icon: string,
        logo: string,
        games: string
      },
      by: string,
      refreshImages: string,
      saveImage: string,
      addLocalImages: string,
      retryDownload: string,
      generateAppList: string,
      saveAppList: string,
      removeAppList: string,
      remainingImages: string,
      stopUrlRetrieving: string,
      exportSelections: string,
      importSelections: string
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
        savingCategories: string,
        savingControllers: string,
        removingFromCategories: string,
        writingVDF_entries__i: string, // ${batchSize},
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
        noAccountsWarning: string,
        preparingExport: string,
        exportProgress__i: string,
        readingSelections: string
      },
      errors: {
        fatalError: string,
        fatalError__i: string, //${error}
        knownSteamDirListIsEmpty: string,
        steamIsRunning: string,
        categorySaveError: string,
        categorySaveError__i: string, //${error}
        controllerSaveError: string,
        controllerSaveError__i: string, //${error}
        retryingDownload__i: string //${imageUrl}, ${appTitle},
        providerError__i: string//${provider}, ${code}, ${title}, ${url}
        unknownProviderError__i: string, //${provider}, ${title}, ${error}
        exportError__i: string, //${error}
        importJSONFailError__i: string, //${error}
        importFailError__i: string //${error}
      },
      success: {
        writingVDF_entries: string,
        removingVDF_entries: string,
        exportSuccess__i: string, //${path}
        importSelectionsSuccess__i: string //${count}
      }
    }
  },
  steamParser: {
    onlyGamesTitle: string,
    onlyInstalledTitle: string,
    sourceModsTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      directoryInvalid: string,
      noSteamAccounts: string,
      steamChanged__i: string,
      fatalError__i: string
    }
  },
  nonSRMShortcutsParser: {
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      noSteamAccounts: string,
      fatalError__i: string
    }
  }
  battleNetParser: {
    battleExeOverrideTitle: string,
    battleExeOverridePlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      fatalError__i: string,
      battleNotCompatible: string
    }
  },
  UWPParser: {
    UWPDirTitle: string,
    UWPDirPlaceholder: string,
    UWPLauncherModeTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      fatalError__i: string,
      UWPNotCompatible: string
    }
  },
  itchIoParser: {
    itchIoAppDataOverrideTitle: string,
    itchIoAppDataOverridePlaceholder: string,
    itchIoWindowsOnLinuxInstallDriveRedirectTitle: string,
    itchIoWindowsOnLinuxInstallDriveRedirectPlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      invalidItchIoAppDataOverride: string,
      invalidItchIoWindowsOnLinuxInstallDriveRedirect: string,
      osUnsupported: string,
      fatalError__i: string,
      databaseNotFound: string
    }
  },
  eaDesktopParser: {
    eaGamesDirTitle: string,
    eaGamesDirPlaceholder: string,
    eaLauncherModeTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      invalidXML__i: string,
      eaNotCompatible: string,
      fatalError__i: string
    }
  },
  amazonGamesParser: {
    exeOverrideTitle: string,
    exeOverridePlaceholder: string,
    launcherModeInputTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      invalidExeOverride: string,
      osUnsupported: string,
      databaseNotFound: string,
      fatalError__i: string
    }
  },
  manualParser: {
    manifestsInputTitle: string,
    manifestsInputPlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      fatalError__i: string
    }
  },
  epicParser: {
    manifestsInputTitle: string,
    manifestsInputPlaceholder: string,
    launcherModeInputTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      invalidManifestsOverride: string,
      epicNotCompatible: string,
      epicNotInstalled: string,
      fatalError__i: string
    }
  },
  legendaryParser: {
    legendaryInstalledFileTitle: string,
    legendaryInstalledFilePlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      legendaryNotInstalled: string,
      fatalError__i: string
    }
  },
  uplayParser: {
    uplayDirTitle: string,
    uplayDirPlaceholder: string,
    launcherModeInputTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      invalidManifestsOverride: string,
      uplayNotCompatible: string,
      uplayNotInstalled: string,
      uplayDirNotFound: string,
      fatalError__i: string
    }
  },
  gogParser: {
    galaxyExeOverrideTitle: string,
    galaxyExeOverridePlaceholderWin: string,
    galaxyExeOverridePlaceholderMac: string,
    launcherModeInputTitle: string,
    parseLinkedExecsTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    }, errors: {
      invalidGalaxyExeOverride: string,
      gogNotCompatible: string,
      gogNotInstalled: string,
      fatalError__i: string
    }
  },
  globParser: {
    inputTitle: string,
    inputPlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      noTitle__md: string,
      moreThanOneTitle__md: string,
      noStarNextToTitle__md: string,
      noAnyCharNextToTitle__md: string,
      noGlobstarOnBothSides__md: string,
      noBracedDirSetOnBothSides__md: string,
      noBracedDirSetOrGlobstarOnBothSides__md: string,
      noEmptyPattern__md: string,
      noEmptyCharRange__md: string,
      noStarInPatternNextToTitle__md: string,
      noAnyCharInPatternNextToTitle__md: string
    }
  },
  globRegexParser: {
    inputTitle: string,
    inputPlaceholder: string,
    docs__md: {
      self: string[],
      input: string[]
    },
    errors: {
      noRegex__md: string,
      moreThanOneRegex__md: string,
      noStarNextToRegex__md: string,
      noAnyCharNextToRegex__md: string,
      noGlobstarOnBothSides__md: string,
      noBracedDirSetOnBothSides__md: string,
      noBracedDirSetOrGlobstarOnBothSides__md: string,
      noEmptyPattern__md: string,
      noEmptyCharRange__md: string,
      noStarInPatternNextToRegex__md: string,
      noAnyCharInPatternNextToRegex__md: string
    }
  },
  sgdbProvider: {
    nsfwInputTitle: string,
    humorInputTitle: string,
    imageMotionTypesTitle: string,
    stylesTitle: string,
    stylesHeroTitle: string,
    stylesLogoTitle: string,
    stylesIconTitle: string,
    sizesTitle: string,
    sizesHeroTitle: string,
    sizesIconTitle: string,
    docs__md: {
      self: string[],
      input: string[]
    }
  },
  logger: {
    component: {
      noMessages: string,
      error: string,
      info: string,
      success: string,
      fuzzy: string,
      textWrap: string,
      autoscroll: string,
      clearLog: string,
      issueDescription: string,
      handleExample: string
      docs__md: {
        self: string[]
      }
    }
  },
  customVariables: {
    service: {
      error: {
        failedToDownload__i: string,//${error}
        writingError: string,
        loadingError: string,
        corruptedVariables__i: string//${file}, ${error}
      },
      info: {
        downloaded: string
      }
    }
  },
  configPresets: {
    service: {
      error: {
        failedToDownload__i: string,//${error}
        writingError: string,
        loadingError: string,
        corruptedVariables__i: string//${file}, ${error}
      },
      info: {
        downloaded: string
      }
    }
  },
  settings: {
    component: {
      label: {
        general: string,
        imageProviders: string,
        fuzzy: string,
        environmentVariables: string,
        communityPresets: string
      },
      docs__md: {
        settings: string[]
      },
      text: {
        offlineMode: string,
        autoUpdate: string,
        removeApps_desc: string,
        removeApps_btn: string,
        preloadImages: string,
        fuzzy_verbose: string,
        fuzzy_filter: string,
        enabledProviders: string,
        dnsServers: string,
        selectLanguage: string,
        selectTheme: string,
        resetFuzzy_desc: string,
        resetFuzzyCache_desc: string,
        resetFuzzy_btn: string,
        customVariables_desc: string,
        configPresets_desc: string,
        showSteamImages: string,
        deleteDisabledShortcuts: string,
        clearLogOnTest: string,
        configDir: string
      },
      placeholder: {
        noProviders: string,
        userAccounts: string,
        bySystem: {
          [key: string]: {
            steamDirectory: string,
            romsDirectory: string,
            retroarchPath: string,
            raCoresDirectory: string,
            localImagesDirectory: string
          },
        }
      }
    },
    service: {
      info: {
        updatingSettings: string
      }
      error: {
        writingError: string,
        readingError: string,
        corruptedSettings__i: string//${file}, ${error}
      }
    }
  },
  nav: {
    component: {
      about: string,
      preview: string,
      view: string,
      logger: string,
      settings: string,
      parsers: string,
      customVariables: string,
      userExceptions: string,
      noTitle: string
    }
  },
  userExceptions:{
    component: {
      buttons: {
        save: string,
        undoChanges: string,
        deleteAll: string,
        addItem: string,
        deleteItem: string

      },
      docs__md: {
        userExceptions: string[]
      },
      text: {
        title: string,
        exclude: string,
        excludeArtwork: string
      },
      placeholder: {
        sortBy: string
      }
    },
    service: {
      error: {
        loadingError: string,
        corruptedExceptions__i: string, //${file},${error}
        writingError: string
      }
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
        faq: string,
        undoChanges: string,
        undoDelete: string,
        toClipboard: string,
      },
      docs__md: {
        intro: string[],
        faq: string[],
        communityPresets: string[],
        parserType: string[],
        configTitle: string[],
        steamCategories: string[],
        controllerTemplates: string[],
        executableLocation: string[],
        romDirectory: string[],
        steamDirectory: string[],
        startInDirectory: string[],
        userAccounts: string[],
        titleModifier: string[],
        executableModifier: string[],
        titleFromVariable: string[],
        fuzzyMatch: string[],
        executableArgs: string[],
        onlineImageQueries: string[],
        imageProviders: string[],
        imagePool: string[],
        defaultImage: string[],
        defaultTallImage: string[],
        defaultHeroImage: string[],
        defaultLogoImage: string[],
        defaultIcon: string[],
        localImages: string[],
        localTallImages: string[],
        localHeroImages: string[],
        localLogoImages: string[],
        localIcons: string[]
      },
      info: {
        testStarting__i: string, //${title}, ${version}, ${portable}
        opSys__i: string, //${os}
        testCompleted: string,
        nothingWasFound: string,
        copiedToClipboard: string,
        userExclusions: string,
        excludedFileInfo__i: string, //${index}, ${total}, ${filename},
        removingControllers__i: string, //${configTitle},
        fetchingControllerTemplates: string
      },
      error: {
        missingAccounts__i: string, //${count}
        missingAccountInfo__i: string, //${name}
        noAccountsWarning: string,
        failedToMatch: string,
        cannotParseUserIDs: string,
        failedFileInfo__i: string, //${index}, ${total}, ${filename}
        testFailed: string,
        cannotTestInvalid: string,
        cannotCopyInvalid: string,
        failedToCopy: string,
        cannotFetchTemplates: string,
        errorRemovingControllers: string,
        cannotRemoveControllers: string
      },
      success: {
        foundAccounts__i: string, //${count}
        foundAccountInfo__i: string, //${name}, ${steamID64}, ${accountID}
        steamCategories__i: string, //${index}, ${total}, ${steamCategories}
        steamCategoriesInfo__i: string, //${steamCategories}
        appId__i: string, //${index}, ${total}, ${appid}
        exceptionKey__i: string, //${index}, ${total}, ${appid}
        shortAppId__i: string, //${index}, ${total}, ${appid}
        extractedTitle__i: string, //${index}, ${total}, ${title}
        fuzzyTitle__i: string, //${index}, ${total}, ${title}
        finalTitle__i: string, //${index}, ${total}, ${title}
        filePath__i: string, //${index}, ${total}, ${filePath}
        startDir__i: string, //${index}, ${total}, ${filePath}
        completeShortcut__i: string, //${index}, ${total}, ${shortcut}
        firstImageQuery__i: string, //${index}, ${total}, ${query}
        imageQueries__i: string, //${index}, ${total}, ${query}
        defaultImage__i: string, //${index}, ${total}, ${artworkType}, ${image}
        resolvedDefaultImage__i: string, //${index}, ${total}, ${artworkType}
        localImages__i: string, //${index}, ${total}, ${artworkType}
        resolvedLocalImages__i: string, //${index}, ${total}, ${artworkType}
        indexInfo__i: string, //${index}, ${total}, ${indexed}
        removedControllers__i: string, //${configTitle}
        fetchedTemplates: string
      },
      label: {
        parserType: string,
        configTitle: string,
        steamCategories: string,
        executableLocation: string,
        executableModifier: string,
        romDirectory: string,
        steamDirectory: string,
        startInDirectory: string,
        userAccounts: string,
        titleFromVariable: string,
        titleModifier: string,
        fuzzyMatch: string,
        executableArgs: string,
        onlineImageQueries: string,
        imageProviders: string,
        imagePool: string,
        defaultImage__i: string, //${artworkType}
        localImages__i: string //${artworkType}
      },
      placeholder: {
        parserType: string,
        configTitle: string,
        romDirectory: string,
        steamDirectory: string,
        userAccounts: string,
        titleFromVariable: string,
        titleModifier: string,
        executableLocation: string,
        executableArgs: string,
        executableModifier: string,
        startInDirectory: string,
        defaultImage__i: string, //${artworkType}
        localImages__i: string, //${artworkType}
        imageProviders: string,
        multiAPIPlaceholder: string
      },
      text: {
        skipFileIfVariableWasNotFound: string,
        caseInsensitiveVariables: string,
        fuzzy_use: string,
        fuzzy_removeCharacters: string,
        fuzzy_removeBrackets: string,
        fuzzy_replaceDiacritic: string,
        appendArgsToExecutable: string,
        shortcut_passthrough: string,
        disabled: string,
        advanced: string,
        noTitle: string
      }
    },
    service: {
      info: {
        updatingConfigurations: string
      },
      error: {
        savingConfiguration: string,
        readingConfiguration: string,
        parserTypeMissing: string,
        corruptedConfiguration__i: string,//${file}, ${error}
        fetchingTemplates: string
      },
      validationErrors: {
        parserType__md: string,
        configTitle__md: string,
        parserId__md: string,
        parserInput: {
          noInput: string,
          inputNotAvailable__i: string,//${name}
          incorrectParser: string
        },
        romDir__md: string,
        userAccounts__md: string,
        steamDir__md: string,
        startInDir__md: string,
        executable__md: string
        imagePool__md: string,
        defaultImage__md: string,
        titleModifier__md: string,
        executableModifier__md: string,
        variableString__md: string,
        imageProviders__md: string,
        unhandledValidationKey__md: string,
        genericDir__md: string,
        genericPath__md: string
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
      parserNotFound__i: string, //${name}
      tooManyFieldGlobs__md: string,
      parserIsRequired__md: string,
      noWinSlashes__md: string
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
      emptyDirectoryList: string,
      couldNotPrepareToRead__i: string, //${error}
      couldNotBackupEntries__i: string, //${error}
      couldNotReadEntries__i: string, //${error}
      couldNotWriteEntries: string,
      couldNotMergeEntries__i: string, //${error}
      couldNotRemoveEntries__i: string, //${error}
      nonFatal: string //${error}
    }
  },
  vdfFile: {
    error: {
      readingVdf__i: string, //${filePath}, ${error}
      writingVdf__i: string, //${filePath}, ${error}
      skippingDMCA__i: string //${title}
      corruptedVdf__i: string, //${filePath}, ${error}
      creatingBackup__i: string, //${filePath}, ${error}
      unsupportedMimeType__i: string, //${type}, ${title}
      imageError__i: string //${title}, ${url}, ${error}
    }
  },
  helpers: {
    error: {
      noUserIdsInDir__i: string,  //${steamDirectory}
    }
  }
}

export interface languageContainer {
  [language: string]: {
    langStrings: any,
    markdowns: any
  }
}
