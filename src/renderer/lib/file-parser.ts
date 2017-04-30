import { Parser, UserConfiguration, GenericParser, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy } from '../models';
import { Http } from '@angular/http';
import { cloneDeep } from 'lodash';
import { FuzzyMatcher } from "./fuzzy-matcher";
import { LoggerService } from "./../services";
import * as GenericParsers from './parsers';
import * as glob from 'glob';
import * as path from 'path';

export class FileParser {
    private availableParsers: { [key: string]: GenericParser };
    private fuzzyMatcher: FuzzyMatcher;

    constructor(private http: Http, private loggerService: LoggerService) {
        this.availableParsers = {};

        for (let key in GenericParsers) {
            let parser = (GenericParsers[key].prototype as GenericParser);
            this.availableParsers[parser.getParser().title] = parser;
        }

        this.fuzzyMatcher = new FuzzyMatcher(this.http, this.loggerService);
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
            let fuzzyMatchIsNeeded: boolean = false;
            let parsedConfigs: ParsedUserConfiguration[] = [];
            let promises: Promise<ParsedData>[] = [];
            for (let i = 0; i < configs.length; i++) {
                let parser = this.getParser(configs[i].parserType);
                if (configs[i].fuzzyMatch)
                    fuzzyMatchIsNeeded = true;

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
                    return reject(`Parser "${configs[i].parserType}" not found!`);
            }
            Promise.resolve().then(() => {
                if (fuzzyMatchIsNeeded)
                    return this.fuzzyMatcher.prepareIfNeeded();
            }).then(() => {
                Promise.all(promises).then((data: ParsedDataWithFuzzy[]) => {
                    let localImagePromises: Promise<any>[] = [];
                    for (let i = 0; i < configs.length; i++) {
                        if (configs[i].fuzzyMatch)
                            this.fuzzyMatcher.fuzzyMatch(data[i]);

                        parsedConfigs.push({
                            executableLocation: configs[i].executableLocation,
                            steamCategories: this.getSteamCategories(configs[i].steamCategory),
                            steamDirectory: configs[i].steamDirectory,
                            files: [],
                            failed: []
                        });

                        for (let j = 0; j < data[i].success.length; j++) {
                            let fuzzyTitle = data[i].success[j].fuzzyTitle || data[i].success[j].extractedTitle;
                            parsedConfigs[i].files.push({
                                argumentString: '',
                                resolvedLocalImages: '',
                                localImages: [],
                                fuzzyTitle: fuzzyTitle,
                                extractedTitle: data[i].success[j].extractedTitle,
                                finalTitle: configs[i].titlePrefix + data[i].success[j].extractedTitle + configs[i].titleSuffix,
                                fuzzyFinalTitle: configs[i].titlePrefix + fuzzyTitle + configs[i].titleSuffix,
                                filePath: data[i].success[j].filePath
                            });
                        }
                        parsedConfigs[i].failed = cloneDeep(data[i].failed);

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

    private getSteamCategories(categoryString: string) {
        let regExp = /\${([^\${}]+?)}/g;
        let match = null;
        let categoryArray: string[] = [];
        while ((match = regExp.exec(categoryString)) !== null) {
            if (categoryArray.indexOf(match[1]))
                categoryArray.push(match[1]);
        }
        return categoryArray;
    }

    private parseExecutableArgs(config: UserConfiguration, parsedConfig: ParsedUserConfiguration) {
        for (let i = 0; i < parsedConfig.files.length; i++) {
            parsedConfig.files[i].argumentString = this.resolveUserString(config.executableArgs, config, parsedConfig.files[i]);
        }
    }

    private resolveLocalImages(config: UserConfiguration, parsedConfig: ParsedUserConfiguration) {
        let promises: Promise<void>[] = [];
        for (let i = 0; i < parsedConfig.files.length; i++) {
            if (config.localImages) {
                parsedConfig.files[i].resolvedLocalImages = this.resolveUserString(config.localImages, config, parsedConfig.files[i]);
                parsedConfig.files[i].resolvedLocalImages = path.resolve(config.romDirectory, parsedConfig.files[i].resolvedLocalImages);
                promises.push(this.resolveLocalImage(this.resolveUserString(config.localImages, config, parsedConfig.files[i]), config.romDirectory).then((files) => {
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
            glob(localImage/*.replace(/\\/g, '/')*/, { silent: true, dot: true, realpath: true, cwd: ROMDirectory }, (err, files) => {
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

    private resolveUserString(userString: string, config: UserConfiguration, parsedConfigFile: ParsedUserConfigurationFile) {
        userString = userString.replace(/\${dir}/gi, config.romDirectory);
        userString = userString.replace(/\${title}/gi, parsedConfigFile.extractedTitle);
        userString = userString.replace(/\${fuzzyTitle}/gi, parsedConfigFile.fuzzyTitle);
        userString = userString.replace(/\${finalTitle}/gi, parsedConfigFile.finalTitle);
        userString = userString.replace(/\${fuzzyFinalTitle}/gi, parsedConfigFile.fuzzyFinalTitle);
        userString = userString.replace(/\${file}/gi, path.basename(parsedConfigFile.filePath));
        userString = userString.replace(/\${filePath}/gi, parsedConfigFile.filePath);
        userString = userString.replace(/\${sep}/gi, path.sep);
        return userString;
    }
}