export interface UserConfiguration {
    parserType: string,
    configTitle: string,
    steamCategory: string,
    executableLocation: string,
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
        limitToGroups: string,
        skipFileIfVariableWasNotFound: boolean,
        caseInsensitiveVariables: boolean,
        tryToMatchTitle: boolean
    },
    fuzzyMatch: {
        use: boolean,
        removeCharacters: boolean,
        removeBrackets: boolean
    },
    onlineImageQueries: string,
    imageProviders: string[],
    executableArgs: string,
    imagePool: string,
    appendArgsToExecutable: boolean,
    localImages: string,
    localIcons: string,
    titleModifier: string,
    disabled: boolean,
    advanced: boolean
}