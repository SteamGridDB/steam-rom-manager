import { UserConfiguration, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData, ParserVariableData, AllVariables } from '../models';
import { getAvailableLogins } from "./steam-id-helpers";
import { FuzzyService } from "./../services";
import { VariableParser } from "./variable-parser";
import { gApp } from "../app.global";
import { parsers, availableParsers } from './parsers';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';

export class FileParser {
    private availableParsers = parsers;
    private globCache: any = {};

    constructor(private fuzzyService: FuzzyService) { }

    private get lang() {
        return gApp.lang.fileParser;
    }

    getAvailableParsers() {
        return availableParsers();
    }

    getParserInfo(key: string) {
        return this.availableParsers[key] ? this.availableParsers[key].getParserInfo() : undefined;
    }

    validateFieldGlob(input: string) {
        let regex = /\$\(\${(.*?)}(?:\|(.*?))?\)\$/;
        let match = regex.exec(input);
        let vParser = new VariableParser({ left: '${', right: '}' });

        if (match !== null) {
            let fieldSets = input.match(/\$\(.*?\)\$/g);
            if (fieldSets != null && fieldSets.length > 1)
                return this.lang.error.tooManyFieldGlobs__md;

            let error = null;
            if (!match[1])
                error = this.lang.error.parserIsRequired__md;
            else if ('title' === match[1].toLowerCase())
                error = this.availableParsers['Glob'].getParserInfo().inputs['glob'].validationFn(input.replace(match[0], `\${${match[1]}}`), true);
            else
                error = this.availableParsers['Glob-regex'].getParserInfo().inputs['glob-regex'].validationFn(input.replace(match[0], `\${${match[1]}}`), true);

            if (match[2])
                error = vParser.setInput(input.replace(match[0], match[2])).isValid() ? null : gApp.lang.parsers.service.validationErrors.variableString__md;

            if (error)
                return error;
        }
        else {
            if (!vParser.setInput(input).isValid())
                return gApp.lang.parsers.service.validationErrors.variableString__md;
        }

        if (/\\/g.test(vParser.setInput(input).parse() ? vParser.removeVariables() : input)) {
            return this.lang.error.noWinSlashes__md;
        }
    }

    executeFileParser(configs: UserConfiguration[]) {
        let steamDirectories: { directory: string, useCredentials: boolean, data: userAccountData[] }[] = [];
        let totalUserAccountsFound: number = 0;
        let parsedConfigs: ParsedUserConfiguration[] = [];

        this.globCache = {};

        return Promise.resolve().then(() => {
            let promises: Promise<ParsedData>[] = [];
            for (let i = 0; i < configs.length; i++) {
                let parser = this.getParserInfo(configs[i].parserType);

                steamDirectories.push({ directory: configs[i].steamDirectory, useCredentials: configs[i].userAccounts.useCredentials, data: [] });

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
            return Promise.resolve().then(() => {
                if (steamDirectories.length) {
                    let availableLogins: Promise<userAccountData[]>[] = [];
                    for (let i = 0; i < steamDirectories.length; i++) {
                        availableLogins.push(getAvailableLogins(steamDirectories[i].directory, steamDirectories[i].useCredentials));
                    }
                    return Promise.all(availableLogins).then((data) => {
                        for (let i = 0; i < steamDirectories.length; i++) {
                            steamDirectories[i].data = data[i];
                        }
                    });
                }
            }).then(() => {
                return parserPromises;
            });
        }).then((parserPromises) => {
            return Promise.all(parserPromises);
        }).then((data: ParsedDataWithFuzzy[]) => {
            let localImagePromises: Promise<any>[] = [];
            let localIconPromises: Promise<any>[] = [];
            let vParser = new VariableParser({ left: '${', right: '}' });

            for (let i = 0; i < configs.length; i++) {
                if (configs[i].fuzzyMatch.use)
                    this.fuzzyService.fuzzyMatcher.fuzzyMatchParsedData(data[i], configs[i].fuzzyMatch.removeCharacters, configs[i].fuzzyMatch.removeBrackets);

                let userFilter = vParser.setInput(configs[i].userAccounts.specifiedAccounts).parse() ? _.uniq(vParser.extractVariables(data => data)) : [];
                let filteredAccounts = this.filterUserAccounts(steamDirectories[i].data, userFilter, configs[i].steamDirectory, configs[i].userAccounts.skipWithMissingDataDir);

                totalUserAccountsFound += filteredAccounts.found.length;

                parsedConfigs.push({
                    appendArgsToExecutable: configs[i].appendArgsToExecutable,
                    imageProviders: configs[i].imageProviders,
                    foundUserAccounts: filteredAccounts.found,
                    missingUserAccounts: filteredAccounts.missing,
                    steamDirectory: configs[i].steamDirectory,
                    files: [],
                    failed: []
                });

                for (let j = 0; j < data[i].success.length; j++) {
                    let fuzzyTitle = data[i].success[j].fuzzyTitle || data[i].success[j].extractedTitle;
                    let executableLocation = configs[i].executableLocation ? configs[i].executableLocation : data[i].success[j].filePath;

                    parsedConfigs[i].files.push({
                        steamCategories: undefined,
                        executableLocation: executableLocation,
                        startInDirectory: configs[i].startInDirectory.length > 0 ? configs[i].startInDirectory : path.dirname(executableLocation),
                        argumentString: '',
                        resolvedLocalImages: [],
                        localImages: [],
                        resolvedLocalIcons: [],
                        localIcons: [],
                        fuzzyTitle: fuzzyTitle,
                        extractedTitle: data[i].success[j].extractedTitle,
                        finalTitle: undefined,
                        filePath: data[i].success[j].filePath,
                        imagePool: undefined,
                        onlineImageQueries: undefined
                    });

                    let lastFile = parsedConfigs[i].files[parsedConfigs[i].files.length - 1];
                    let variableData = this.makeVariableData(configs[i], lastFile);

                    lastFile.finalTitle = vParser.setInput(configs[i].titleModifier).parse() ? vParser.replaceVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    }) : '';

                    variableData.finalTitle = lastFile.finalTitle;

                    lastFile.imagePool = vParser.setInput(configs[i].imagePool).parse() ? vParser.replaceVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    }) : '';
                    lastFile.onlineImageQueries = vParser.setInput(configs[i].onlineImageQueries).parse() ? _.uniq(vParser.extractVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    })) : [];
                    lastFile.steamCategories = vParser.setInput(configs[i].steamCategory).parse() ? _.uniq(vParser.extractVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    })) : [];
                }

                parsedConfigs[i].failed = _.cloneDeep(data[i].failed);

                this.parseExecutableArgs(configs[i], parsedConfigs[i], vParser);
                localImagePromises.push(this.resolveFieldGlobs('localImages', configs[i], parsedConfigs[i], vParser).then((data) => {
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
                localIconPromises.push(this.resolveFieldGlobs('localIcons', configs[i], parsedConfigs[i], vParser).then((data) => {
                    for (let j = 0; j < data.parsedConfig.files.length; j++) {
                        data.parsedConfig.files[j].resolvedLocalIcons = data.resolvedGlobs[j];
                        data.parsedConfig.files[j].localIcons = data.resolvedFiles[j];
                    }
                }));
            }
            return Promise.all(localImagePromises).then(() => Promise.all(localIconPromises));
        }).then(() => {
            return { parsedConfigs, noUserAccounts: totalUserAccountsFound === 0 };
        });
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

    private parseExecutableArgs(config: UserConfiguration, parsedConfig: ParsedUserConfiguration, vParser: VariableParser) {
        for (let i = 0; i < parsedConfig.files.length; i++) {
            let variableData = this.makeVariableData(config, parsedConfig.files[i]);
            parsedConfig.files[i].argumentString = vParser.setInput(config.executableArgs).parse() ? vParser.replaceVariables((variable) => {
                return this.getVariable(variable as AllVariables, variableData);
            }) : '';
        }
    }

    private resolveFieldGlobs(field: string, config: UserConfiguration, parsedConfig: ParsedUserConfiguration, vParser: VariableParser) {
        let promises: Promise<void>[] = [];
        let resolvedGlobs: string[][] = [];
        let resolvedFiles: string[][] = [];

        for (let i = 0; i < parsedConfig.files.length; i++) {
            resolvedGlobs.push([]);
            resolvedFiles.push([]);

            let fieldValue = config[field];
            if (fieldValue) {
                let variableData = this.makeVariableData(config, parsedConfig.files[i]);
                let expandableSet = /\$\((\${.+?})(?:\|(.*?))?\)\$/.exec(fieldValue);

                if (expandableSet === null) {
                    let replacedGlob = path.resolve(config.romDirectory, vParser.setInput(fieldValue).parse() ? vParser.replaceVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    }) : '').replace(/\\/g, '/');

                    resolvedGlobs[i].push(replacedGlob);
                    promises.push(this.globPromise(replacedGlob, { silent: true, dot: true, realpath: true, cwd: config.romDirectory, cache: this.globCache }).then((files) => {
                        resolvedFiles[i] = files;
                    }));
                }
                else {
                    let secondaryMatch: string = undefined;
                    let parserMatch = fieldValue.replace(expandableSet[0], '$()$');
                    parserMatch = vParser.setInput(parserMatch).parse() ? vParser.replaceVariables((variable) => {
                        return this.getVariable(variable as AllVariables, variableData);
                    }) : '';
                    parserMatch = path.resolve(config.romDirectory, parserMatch.replace('$()$', expandableSet[1])).replace(/\\/g, '/');
                    resolvedGlobs[i].push(parserMatch);

                    if (expandableSet[2] != undefined) {
                        secondaryMatch = fieldValue.replace(expandableSet[0], expandableSet[2] || '');
                        secondaryMatch = path.resolve(config.romDirectory, vParser.setInput(secondaryMatch).parse() ? vParser.replaceVariables((variable) => {
                            return this.getVariable(variable as AllVariables, variableData);
                        }) : '').replace(/\\/g, '/');
                        resolvedGlobs[i].push(secondaryMatch);
                    }

                    promises.push(Promise.resolve().then(() => {
                        if (/\${title}/i.test(expandableSet[1]))
                            return this.availableParsers['Glob'].execute(config.romDirectory, { 'glob': parserMatch }, this.globCache);
                        else
                            return this.availableParsers['Glob-regex'].execute(config.romDirectory, { 'glob-regex': parserMatch }, this.globCache);
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

    private getVariable(variable: AllVariables, data: ParserVariableData) {
        const unavailable = 'undefined';
        let output = variable as string;
        switch (<AllVariables>variable.toUpperCase()) {
            case '/':
                output = path.sep;
                break;
            case 'EXEDIR':
                output = data.executableLocation != undefined ? path.dirname(data.executableLocation) : unavailable;
                break;
            case 'EXEEXT':
                output = data.executableLocation != undefined ? path.extname(data.executableLocation) : unavailable;
                break;
            case 'EXENAME':
                output = data.executableLocation != undefined ? path.basename(data.executableLocation, path.extname(data.executableLocation)) : unavailable;
                break;
            case 'EXEPATH':
                output = data.executableLocation != undefined ? data.executableLocation : unavailable;
                break;
            case 'FILEDIR':
                output = data.filePath != undefined ? path.dirname(data.filePath) : unavailable;
                break;
            case 'FILEEXT':
                output = data.filePath != undefined ? path.extname(data.filePath) : unavailable;
                break;
            case 'FILENAME':
                output = data.filePath != undefined ? path.basename(data.filePath, path.extname(data.filePath)) : unavailable;
                break;
            case 'FILEPATH':
                output = data.filePath != undefined ? data.filePath : unavailable;
                break;
            case 'FINALTITLE':
                output = data.finalTitle != undefined ? data.finalTitle : unavailable;
                break;
            case 'FUZZYTITLE':
                output = data.fuzzyTitle != undefined ? data.fuzzyTitle : unavailable;
                break;
            case 'ROMDIR':
                output = data.romDirectory != undefined ? data.romDirectory : unavailable;
                break;
            case 'STARTINDIR':
                output = data.startInDirectory != undefined ? data.startInDirectory : unavailable;
                break;
            case 'STEAMDIR':
                output = data.steamDirectory != undefined ? data.steamDirectory : unavailable;
                break;
            case 'TITLE':
                output = data.extractedTitle != undefined ? data.extractedTitle : unavailable;
                break;
            default:
                {
                    let match = /^\/(.*?)\/([giu]{0,3})\|(.*?)(?:\|(.*?))?$/.exec(output);
                    if (match) {
                        let regex = new RegExp(match[1], match[2] || '');
                        let replaceText = match[3];
                        if (replaceText === 'string') {
                            output = output.replace(regex, replaceText);
                        }
                        else {
                            let innerMatch = output.match(regex);
                            if (innerMatch !== null) {
                                output = '';
                                for (let i = 1; i < innerMatch.length; i++) {
                                    if (innerMatch[i])
                                    output += innerMatch[i];
                                }
                                if (output.length === 0)
                                output = innerMatch[0];
                            }
                        }
                    }
                }
                break;
        }
        return output;
    }

    private makeVariableData(config: UserConfiguration, parsedConfigFile: ParsedUserConfigurationFile) {
        return <ParserVariableData>{
            executableLocation: parsedConfigFile.executableLocation,
            startInDirectory: parsedConfigFile.startInDirectory,
            extractedTitle: parsedConfigFile.extractedTitle,
            steamDirectory: config.steamDirectory,
            filePath: parsedConfigFile.filePath,
            finalTitle: parsedConfigFile.finalTitle,
            fuzzyTitle: parsedConfigFile.fuzzyTitle,
            romDirectory: config.romDirectory
        }
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