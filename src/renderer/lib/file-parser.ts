import { Parser, UserConfiguration, GenericParser, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData } from '../models';
import { getAvailableLogins } from "./steam-id-helpers";
import { FuzzyService } from "./../services";
import { VariableParser } from "./variable-parser";
import { gApp } from "../app.global";
import * as GenericParsers from './parsers';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';

export class FileParser {
    private availableParsers: { [key: string]: GenericParser };
    private globCache: any = {};

    constructor(private fuzzyService: FuzzyService) {
        this.availableParsers = {};

        for (let key in GenericParsers) {
            let parser = (GenericParsers[key].prototype as GenericParser);
            this.availableParsers[parser.getParser().title] = parser;
        }
    }

    private get lang() {
        return gApp.lang.fileParser;
    }

    getAvailableParsers() {
        let parsers: string[] = [];
        for (let key in this.availableParsers) {
            parsers.push(key);
        }
        return parsers;
    }

    getParser(key: string) {
        return this.availableParsers[key] ? this.availableParsers[key].getParser() : undefined;
    }

    executeFileParser(configs: UserConfiguration[]) {
        let steamDirectories: string[] = [];
        let steamDirectoryAccounts: { [directory: string]: userAccountData[] } = {};
        let parsedConfigs: ParsedUserConfiguration[] = [];
        let userAccountFound: boolean = false;

        this.globCache = {};

        return Promise.resolve().then(() => {
            let promises: Promise<ParsedData>[] = [];
            for (let i = 0; i < configs.length; i++) {
                let parser = this.getParser(configs[i].parserType);

                if (steamDirectories.indexOf(configs[i].steamDirectory) === -1)
                    steamDirectories.push(configs[i].steamDirectory);

                if (parser) {
                    if (parser.inputs !== undefined) {
                        for (var inputName in parser.inputs) {
                            if (parser.inputs[inputName].forcedInput)
                                configs[i].parserInputs[inputName] = parser.inputs[inputName].forcedInput;
                            else if (configs[i].parserInputs[inputName] === undefined)
                                configs[i].parserInputs[inputName] = '';
                        }
                    }
                    promises.push(this.availableParsers[configs[i].parserType].execute(configs[i].romDirectory, configs[i].parserInputs, this.globCache));
                }
                else
                    throw new Error(this.lang.error.parserNotFound__i.interpolate({ name: configs[i].parserType }));
            }
            return promises;
        }).then((parserPromises) => {
            if (steamDirectories.length) {
                let availableLogins: Promise<userAccountData[]>[] = [];
                for (let i = 0; i < steamDirectories.length; i++) {
                    steamDirectoryAccounts[steamDirectories[i]] = [];
                    availableLogins.push(getAvailableLogins(steamDirectories[i]));
                }
                return Promise.all(availableLogins).then((data) => {
                    for (let i = 0; i < steamDirectories.length; i++) {
                        if (data[i].length > 0)
                            userAccountFound = true;
                        steamDirectoryAccounts[steamDirectories[i]] = data[i];
                    }
                    return parserPromises;
                });
            }
            return parserPromises;
        }).then((parserPromises) => {
            return Promise.all(parserPromises);
        }).then((data: ParsedDataWithFuzzy[]) => {
            let localImagePromises: Promise<any>[] = [];
            let localIconPromises: Promise<any>[] = [];
            for (let i = 0; i < configs.length; i++) {
                if (data[i].success.length === 0)
                    continue;

                if (configs[i].fuzzyMatch.use)
                    this.fuzzyService.fuzzyMatcher.fuzzyMatchParsedData(data[i], configs[i].fuzzyMatch.removeCharacters, configs[i].fuzzyMatch.removeBrackets);

                let userFilter = this.parseVariableString(configs[i].userAccounts.specifiedAccounts);
                let filteredAccounts = this.filterUserAccounts(steamDirectoryAccounts[configs[i].steamDirectory], userFilter, configs[i].steamDirectory, configs[i].userAccounts.skipWithMissingDataDir);

                parsedConfigs.push({
                    steamCategories: this.parseVariableString(configs[i].steamCategory),
                    imageProviders: configs[i].imageProviders,
                    foundUserAccounts: filteredAccounts.found,
                    missingUserAccounts: filteredAccounts.missing,
                    steamDirectory: configs[i].steamDirectory,
                    files: [],
                    failed: []
                });

                for (let j = 0; j < data[i].success.length; j++) {
                    let fuzzyTitle = data[i].success[j].fuzzyTitle || data[i].success[j].extractedTitle;
                    parsedConfigs[i].files.push({
                        executableLocation: `"${configs[i].executableLocation ? configs[i].executableLocation : data[i].success[j].filePath}"`,
                        argumentString: '',
                        resolvedLocalImages: [],
                        localImages: [],
                        resolvedLocalIcons: [],
                        localIcons: [],
                        fuzzyTitle: fuzzyTitle,
                        extractedTitle: data[i].success[j].extractedTitle,
                        finalTitle: configs[i].titleModifier.replace(/\${title}/gi, data[i].success[j].extractedTitle),
                        fuzzyFinalTitle: configs[i].titleModifier.replace(/\${title}/gi, fuzzyTitle),
                        filePath: data[i].success[j].filePath,
                        onlineImageQueries: undefined
                    });

                    let lastFile = parsedConfigs[i].files[parsedConfigs[i].files.length - 1];
                    lastFile.onlineImageQueries = this.parseVariableString(this.replaceConstants(configs[i].onlineImageQueries, configs[i], lastFile), true);
                }

                parsedConfigs[i].failed = _.cloneDeep(data[i].failed);

                this.parseExecutableArgs(configs[i], parsedConfigs[i]);
                localImagePromises.push(this.resolveFieldGlobs('localImages', configs[i], parsedConfigs[i]).then((data) => {
                    for (let j = 0; j < data.parsedConfig.files.length; j++) {
                        data.parsedConfig.files[j].resolvedLocalImages = data.resolvedGlobs[j];

                        let extRegex = /png|tga|jpg|jpeg/i;
                        data.parsedConfig.files[j].localImages = data.resolvedFiles[j].filter((item) => {
                            return extRegex.test(path.extname(item));
                        }).map((item) => {
                            return encodeURI(`file:///${item.replace(/\\/g, '/')}`);
                        });
                    }
                }));
                localIconPromises.push(this.resolveFieldGlobs('localIcons', configs[i], parsedConfigs[i]).then((data) => {
                    for (let j = 0; j < data.parsedConfig.files.length; j++) {
                        data.parsedConfig.files[j].resolvedLocalIcons = data.resolvedGlobs[j];
                        data.parsedConfig.files[j].localIcons = data.resolvedFiles[j];
                    }
                }));
            }
            return Promise.all(localImagePromises).then(() => Promise.all(localIconPromises));
        }).then(() => {
            return { parsedConfigs, noUserAccounts: !userAccountFound };
        });
    }

    private parseVariableString(input: string, uniqueOnly: boolean = false) {
        let vParser = new VariableParser('${', '}', input);
        let parsedData = vParser.isValid() ? _.pull(vParser.getContents(true), '') : [];
        if (uniqueOnly) {
            return _.uniq(parsedData);
        }
        else
            return parsedData;
    }

    private filterUserAccounts(accountData: userAccountData[], nameFilter: string[], steamDirectory: string, skipWithMissingDirectories: boolean) {
        let data: { found: userAccountData[], missing: string[] } = { found: [], missing: [] };

        if (nameFilter.length === 0) {
            nameFilter = _.map(accountData, 'name');
        }

        if (nameFilter.length > 0) {
            for (let i = 0; i < nameFilter.length; i++) {
                let index = accountData.findIndex((item) => item.name === nameFilter[i]);
                if (index !== -1) {
                    if (skipWithMissingDirectories) {
                        let accountPath = path.join(steamDirectory, 'userdata', accountData[index].accountID);
                        if (!this.validatePath(accountPath, true))
                            continue;
                    }
                    data.found.push(accountData[index]);
                }
                else
                    data.missing.push(nameFilter[i]);
            }
        }
        return data;
    }

    private parseExecutableArgs(config: UserConfiguration, parsedConfig: ParsedUserConfiguration) {
        for (let i = 0; i < parsedConfig.files.length; i++) {
            if (config.appendArgsToExecutable)
                parsedConfig.files[i].executableLocation += ` ${this.replaceConstants(config.executableArgs, config, parsedConfig.files[i])}`;
            else
                parsedConfig.files[i].argumentString = this.replaceConstants(config.executableArgs, config, parsedConfig.files[i]);
        }
    }

    private resolveFieldGlobs(field: string, config: UserConfiguration, parsedConfig: ParsedUserConfiguration) {
        let promises: Promise<void>[] = [];
        let resolvedGlobs: string[][] = [];
        let resolvedFiles: string[][] = [];

        for (let i = 0; i < parsedConfig.files.length; i++) {
            resolvedGlobs.push([]);
            resolvedFiles.push([]);

            let fieldValue = config[field];
            if (fieldValue) {
                let expandableSet = /\$\((\${.+?})(?:\|(.+))?\)\$/.exec(fieldValue);

                if (expandableSet === null) {
                    let replacedGlob = path.resolve(config.romDirectory, this.replaceConstants(fieldValue, config, parsedConfig.files[i])).replace(/\\/g, '/');
                    resolvedGlobs[i].push(replacedGlob);

                    promises.push(this.globPromise(replacedGlob, { silent: true, dot: true, realpath: true, cwd: config.romDirectory, cache: this.globCache }).then((files) => {
                        resolvedFiles[i] = files;
                    }));
                }
                else {
                    let secondaryMatch: string = undefined;
                    let parserMatch = fieldValue.replace(expandableSet[0], '$()$');
                    parserMatch = this.replaceConstants(parserMatch, config, parsedConfig.files[i]);
                    parserMatch = path.resolve(config.romDirectory, parserMatch.replace('$()$', expandableSet[1])).replace(/\\/g, '/');
                    resolvedGlobs[i].push(parserMatch);

                    if (expandableSet[2]) {
                        secondaryMatch = fieldValue.replace(expandableSet[0], expandableSet[2]);
                        secondaryMatch = path.resolve(config.romDirectory, this.replaceConstants(secondaryMatch, config, parsedConfig.files[i])).replace(/\\/g, '/');
                    }

                    promises.push(Promise.resolve().then(() => {
                        if (/\${title}/i.test(expandableSet[1]))
                            return this.availableParsers['Glob'].execute(config.romDirectory, { 'glob': parserMatch }, this.globCache, parserMatch.search(config.romDirectory.replace(/\\/g, '/')) === 0);
                        else
                            return this.availableParsers['Glob-regex'].execute(config.romDirectory, { 'glob-regex': parserMatch }, this.globCache, parserMatch.search(config.romDirectory.replace(/\\/g, '/')) === 0);
                    }).then((parsedData) => {
                        for (let j = 0; j < parsedData.success.length; j++) {
                            if (config.fuzzyMatch.use) {
                                if (this.fuzzyService.fuzzyMatcher.fuzzyMatchString(parsedData.success[j].extractedTitle, config.fuzzyMatch.removeCharacters, config.fuzzyMatch.removeBrackets) === parsedConfig.files[i].fuzzyTitle) {
                                    resolvedFiles[i].push(parsedData.success[j].filePath);
                                }
                            }
                            else if (parsedData.success[j].extractedTitle === parsedConfig.files[i].extractedTitle) {
                                resolvedFiles[i].push(parsedData.success[j].filePath);
                            }
                        }
                        if (secondaryMatch !== undefined) {
                            return this.globPromise(secondaryMatch, { silent: true, dot: true, realpath: true, cwd: config.romDirectory, cache: this.globCache }).then((files) => {
                                return resolvedFiles[i].concat(files);
                            });
                        }
                        else
                            return resolvedFiles[i];
                    }).then((files) => {
                        resolvedFiles[i] = _.uniq(files);
                    }));
                }
            }
        }
        return Promise.all(promises).then(() => {
            return { config, parsedConfig, resolvedGlobs, resolvedFiles };
        });
    }

    private replaceConstants(userString: string, config?: UserConfiguration, parsedConfigFile?: ParsedUserConfigurationFile) {
        if (config != undefined)
            userString = userString.replace(/\${dir}/gi, config.romDirectory);

        if (parsedConfigFile != undefined) {
            userString = userString.replace(/\${title}/gi, parsedConfigFile.extractedTitle);
            userString = userString.replace(/\${fuzzyTitle}/gi, parsedConfigFile.fuzzyTitle);
            userString = userString.replace(/\${finalTitle}/gi, parsedConfigFile.finalTitle);
            userString = userString.replace(/\${fuzzyFinalTitle}/gi, parsedConfigFile.fuzzyFinalTitle);
            userString = userString.replace(/\${file}/gi, path.basename(parsedConfigFile.filePath));
            userString = userString.replace(/\${filePath}/gi, parsedConfigFile.filePath);
        }

        userString = userString.replace(/\${sep}/gi, path.sep);
        return userString;
    }

    private validatePath(fsPath: string, checkForDirectory: boolean) {
        try {
            let path = fs.statSync(fsPath);
            return checkForDirectory ? path.isDirectory() : path.isFile();
        } catch (e) {
            return false;
        }
    }

    private globPromise(pattern: string, options: glob.IOptions) {
        return new Promise<string[]>((resolve, reject) => {
            glob(pattern, options, (err, files) => {
                if (err)
                    reject(err);
                else {
                    resolve(files);
                }
            });
        });
    }
}