export interface UserConfiguration {
    parserType: string,
    configTitle: string,
    steamCategory: string,
    executableLocation: string,
    romDirectory: string,
    steamDirectory: string,
    parserInputs: { [inputKey: string]: string },
    executableArgs: string,
    localImages: string,
    titlePrefix: string,
    titleSuffix: string,
    fuzzyMatch: boolean,
    enable: boolean
}

export interface ParsedUserConfigurationFile {
    filePath: string,
    extractedTitle: string,
    fuzzyTitle: string,
    finalTitle: string,
    fuzzyFinalTitle: string,
    argumentString: string,
    resolvedLocalImages: string,
    localImages: string[]
}

export interface ParsedUserConfiguration {
    steamCategories: string[],
    executableLocation: string,
    steamDirectory: string,
    files: ParsedUserConfigurationFile[],
    failed: string[]
}

export interface ParserInputField {
    [inputKey: string]: {
        label: string,
        info?: string,
        forcedInput?: string,
        validationFn?: (inputData: string) => null | string
    }
}

export interface Parser {
    title: string,
    info?: string,
    inputs?: ParserInputField
}

export interface ParsedData {
    success: {
        filePath: string,
        extractedTitle: string
    }[],
    failed: string[]
}

export interface ParsedDataWithFuzzy {
    success: {
        filePath: string,
        extractedTitle: string,
        fuzzyTitle: string
    }[],
    failed: string[]
}

export interface GenericParser {
    getParser(): Parser,
    execute: (config: UserConfiguration) => Promise<ParsedData>
}