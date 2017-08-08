import { Parser, UserConfiguration, GenericParser, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData } from '../models';
import { Http } from '@angular/http';
import { FuzzyListLoader } from "./fuzzy-list-loader";
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
        return new Promise<ParsedUserConfiguration[]>((resolve, reject) => {
            let steamDirectories: string[] = [];
            let steamDirectoryAccounts: { [directory: string]: userAccountData[] } = {};
            let parsedConfigs: ParsedUserConfiguration[] = [];
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
                    promises.push(this.availableParsers[configs[i].parserType].execute(configs[i]));
                }
                else
                    return reject(new Error(this.lang.error.parserNotFound__i.interpolate({ name: configs[i].parserType })));
            }
            Promise.resolve().then(() => {
                if (steamDirectories.length) {
                    let availableLogins: Promise<userAccountData[]>[] = [];
                    for (let i = 0; i < steamDirectories.length; i++) {
                        steamDirectoryAccounts[steamDirectories[i]] = [];
                        availableLogins.push(getAvailableLogins(steamDirectories[i]));
                    }
                    return Promise.all(availableLogins).then((data) => {
                        for (let i = 0; i < steamDirectories.length; i++) {
                            steamDirectoryAccounts[steamDirectories[i]] = data[i];
                        }
                    });
                }
            }).then(() => {
                Promise.all(promises).then((data: ParsedDataWithFuzzy[]) => {
                    let localImagePromises: Promise<any>[] = [];
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
                                resolvedLocalImages: '',
                                localImages: [],
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
                        localImagePromises.push(this.resolveLocalImages(configs[i], parsedConfigs[i]));
                    }
                    Promise.all(localImagePromises).then(() => {
                        resolve(parsedConfigs);
                    }).catch((error) => {
                        reject(error);
                    })
                });
            }).catch((error) => {
                reject(error);
            });
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

    private resolveLocalImages(config: UserConfiguration, parsedConfig: ParsedUserConfiguration) {
        let promises: Promise<void>[] = [];
        for (let i = 0; i < parsedConfig.files.length; i++) {
            if (config.localImages) {
                parsedConfig.files[i].resolvedLocalImages = this.replaceConstants(config.localImages, config, parsedConfig.files[i]);
                parsedConfig.files[i].resolvedLocalImages = path.resolve(config.romDirectory, parsedConfig.files[i].resolvedLocalImages);
                promises.push(this.resolveLocalImage(this.replaceConstants(config.localImages, config, parsedConfig.files[i]), config.romDirectory).then((files) => {
                    for (var j = 0; j < files.length; j++)
                        files[j] = encodeURI('file:///' + files[j].replace(/\\/g, '/'));
                    parsedConfig.files[i].localImages = files;
                }));
            }
        }
        return Promise.all(promises);
    }

    private resolveLocalImage(localImage: string, ROMDirectory: string) {
        return new Promise<string[]>((resolve, reject) => {
            glob(localImage, { silent: true, dot: true, realpath: true, cwd: ROMDirectory }, (err, files) => {
                if (err)
                    reject(err);
                else {
                    let extRegex = /png|tga|jpg|jpeg/i;
                    resolve(files.filter((item) => {
                        return extRegex.test(path.extname(item));
                    }));
                }
            });
        });
    }

    private replaceConstants(userString: string, config?: UserConfiguration, parsedConfigFile?: ParsedUserConfigurationFile) {
        if (config !== undefined)
            userString = userString.replace(/\${dir}/gi, config.romDirectory);

        if (parsedConfigFile !== undefined) {
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
}