export interface UserConfiguration {
    parserType: string,
    configTitle: string,
    steamCategory: string,
    executableLocation: string,
    executableModifier: string,
    romDirectory: string,
    steamDirectory: string,
    startInDirectory: string,
    userAccounts: {
        specifiedAccounts: string,
        skipWithMissingDataDir: boolean,
        useCredentials: boolean
    },
    parserInputs: { [inputKey: string]: string },
    titleFromVariable: {
        shortcutPassthrough: boolean,
        limitToGroups: string,
        skipFileIfVariableWasNotFound: boolean,
        caseInsensitiveVariables: boolean,
        tryToMatchTitle: boolean
    },
    fuzzyMatch: {
        use: boolean,
        removeCharacters: boolean,
        removeBrackets: boolean,
        replaceDiacritics: boolean
    },
    onlineImageQueries: string,
    imageProviders: string[],
    executableArgs: string,
    imagePool: string,
    appendArgsToExecutable: boolean,
    defaultImage: string,
    defaultTallImage: string,
    defaultHeroImage: string,
    defaultLogoImage: string,
    localImages: string,
    localTallImages: string,
    localHeroImages: string,
    localLogoImages: string,
    localIcons: string,
    titleModifier: string,
    disabled: boolean,
    advanced: boolean
}
