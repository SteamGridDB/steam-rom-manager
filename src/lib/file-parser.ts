import { UserConfiguration, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData, ParserVariableData, AllVariables, EnvironmentVariables, CustomVariables } from '../models';
import { FuzzyService } from "../renderer/services";
import { VariableParser } from "./variable-parser";
import { APP } from '../variables';
import { parsers } from './parsers';
import { availableParsers } from './parsers/available-parsers';
import * as url from './helpers/url';
import * as steam from './helpers/steam';
import * as _ from 'lodash';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import {getPath} from 'windows-shortcuts-ps';

export class FileParser {
  private availableParsers = parsers;
  private variableData: CustomVariables = {};
  private globCache: any = {};

  constructor(private fuzzyService: FuzzyService) { }

  private get lang() {
    return APP.lang.fileParser;
  }

  setCustomVariables(data: CustomVariables) {
    this.variableData = data;
  }

  getAvailableParsers() {
    return availableParsers;
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
        error = vParser.setInput(input.replace(match[0], match[2])).isValid() ? null : APP.lang.parsers.service.validationErrors.variableString__md;

      if (error)
        return error;
    }
          else {
            if (!vParser.setInput(input).isValid())
              return APP.lang.parsers.service.validationErrors.variableString__md;
          }

          if (/\\/g.test(vParser.setInput(input).parse() ? vParser.removeVariables() : input)) {
            return this.lang.error.noWinSlashes__md;
          }

          return null;
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
                    availableLogins.push(steam.getAvailableLogins(steamDirectories[i].directory, steamDirectories[i].useCredentials));
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
              let defaultImagePromises: Promise<void>[] = [];
              let defaultTallImagePromises: Promise<void>[] = [];
              let defaultHeroImagePromises: Promise<void>[] = [];
              let defaultLogoImagePromises: Promise<void>[] = [];
              let localImagePromises: Promise<void>[] = [];
              let localTallImagePromises: Promise<void>[] = [];
              let localHeroImagePromises: Promise<void>[] = [];
              let localLogoImagePromises: Promise<void>[] = [];
              let localIconPromises: Promise<void>[] = [];
              let vParser = new VariableParser({ left: '${', right: '}' });

              for (let i = 0; i < configs.length; i++) {
                if (configs[i].titleFromVariable.tryToMatchTitle)
                  this.tryToReplaceTitlesWithVariables(data[i], configs[i], vParser);

                if (configs[i].fuzzyMatch.use)
                  this.fuzzyService.fuzzyMatcher.fuzzyMatchParsedData(data[i], configs[i].fuzzyMatch);

                let userFilter = vParser.setInput(configs[i].userAccounts.specifiedAccounts).parse() ? _.uniq(vParser.extractVariables(data => null)) : [];
                let filteredAccounts = this.filterUserAccounts(steamDirectories[i].data, userFilter, configs[i].steamDirectory, configs[i].userAccounts.skipWithMissingDataDir);

                totalUserAccountsFound += filteredAccounts.found.length;

                parsedConfigs.push({
                  configurationTitle: configs[i].configTitle,
                  parserId: configs[i].parserId,
                  appendArgsToExecutable: configs[i].appendArgsToExecutable,
                  shortcutPassthrough: configs[i].titleFromVariable.shortcutPassthrough,
                  imageProviders: configs[i].imageProviders,
                  foundUserAccounts: filteredAccounts.found,
                  missingUserAccounts: filteredAccounts.missing,
                  steamDirectory: configs[i].steamDirectory,
                  files: [],
                  failed: _.cloneDeep(data[i].failed)
                });

                for (let j = 0; j < data[i].success.length; j++) {
                  let fuzzyTitle = data[i].success[j].fuzzyTitle || data[i].success[j].extractedTitle;

                  // Fail empty titles
                  if (fuzzyTitle.length === 0) {
                    parsedConfigs[i].failed.push(data[i].success[j].filePath);
                    continue;
                  }
                  // Variables on rom directory, start in path, executable path, steam directory too
                  configs[i].executableLocation = vParser.setInput(configs[i].executableLocation).parse() ? vParser.replaceVariables((variable) => {
                    return this.getEnvironmentVariable(variable as EnvironmentVariables).trim()
                  }) : null;
                  let executableLocation = configs[i].executableLocation ? configs[i].executableLocation : data[i].success[j].filePath;

                  parsedConfigs[i].files.push({
                    steamCategories: undefined,
                    executableLocation: executableLocation,
                    modifiedExecutableLocation: undefined,
                    startInDirectory: configs[i].startInDirectory.length > 0 ? configs[i].startInDirectory : path.dirname(executableLocation),
                    argumentString: undefined,
                    resolvedLocalImages: [],
                    resolvedLocalTallImages: [],
                    resolvedLocalHeroImages: [],
                    resolvedLocalLogoImages: [],
                    resolvedDefaultImages: [],
                    resolvedDefaultTallImages: [],
                    resolvedDefaultHeroImages: [],
                    resolvedDefaultLogoImages: [],
                    defaultImage: undefined,
                    defaultTallImage: undefined,
                    defaultHeroImage: undefined,
                    defaultLogoImage: undefined,
                    localImages: [],
                    localTallImages: [],
                    localHeroImages: [],
                    localLogoImages: [],
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
                    return this.getVariable(variable as AllVariables, variableData).trim();
                  }) : '';

                  variableData.finalTitle = lastFile.finalTitle;

                  lastFile.argumentString = vParser.setInput(configs[i].executableArgs).parse() ? vParser.replaceVariables((variable) => {
                    return this.getVariable(variable as AllVariables, variableData).trim();
                  }) : '';
                  lastFile.imagePool = vParser.setInput(configs[i].imagePool).parse() ? vParser.replaceVariables((variable) => {
                    return this.getVariable(variable as AllVariables, variableData).trim();
                  }) : '';
                  lastFile.modifiedExecutableLocation = vParser.setInput(configs[i].executableModifier).parse() ? vParser.replaceVariables((variable) => {
                    return this.getVariable(variable as AllVariables, variableData).trim();
                  }) : '';
                  lastFile.onlineImageQueries = vParser.setInput(configs[i].onlineImageQueries).parse() ? _.uniq(vParser.extractVariables((variable) => {
                    return this.getVariable(variable as AllVariables, variableData);
                  })) : [];
                  lastFile.steamCategories = vParser.setInput(configs[i].steamCategory).parse() ? _.uniq(vParser.extractVariables((variable) => {
                    return this.getVariable(variable as AllVariables, variableData);
                  })) : [];
                }

                defaultImagePromises.push(this.resolveFieldGlobs('defaultImage', configs[i], parsedConfigs[i], vParser).then((data) => {
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedDefaultImages = data.resolvedGlobs[j];
                    let extRegex = /png|tga|jpg|jpeg/i;
                    for (let k = 0; k < data.resolvedFiles[j].length; k++) {
                      const item = data.resolvedFiles[j][k];
                      if (extRegex.test(path.extname(item))) {
                        data.parsedConfig.files[j].defaultImage = url.encodeFile(item);
                        break;
                      }
                    }
                  }
                }));
                defaultTallImagePromises.push(this.resolveFieldGlobs('defaultTallImage',configs[i],parsedConfigs[i],vParser).then((data)=>{
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedDefaultTallImages = data.resolvedGlobs[j];
                    let extRegex = /png|tga|jpg|jpeg/i;
                    for (let k = 0; k < data.resolvedFiles[j].length; k++) {
                      const item = data.resolvedFiles[j][k];
                      if (extRegex.test(path.extname(item))) {
                        data.parsedConfig.files[j].defaultTallImage = url.encodeFile(item);
                        break;
                      }
                    }
                  }
                }));
                defaultHeroImagePromises.push(this.resolveFieldGlobs('defaultHeroImage',configs[i],parsedConfigs[i],vParser).then((data)=>{
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedDefaultHeroImages = data.resolvedGlobs[j];
                    let extRegex = /png|tga|jpg|jpeg/i;
                    for (let k = 0; k < data.resolvedFiles[j].length; k++) {
                      const item = data.resolvedFiles[j][k];
                      if (extRegex.test(path.extname(item))) {
                        data.parsedConfig.files[j].defaultHeroImage = url.encodeFile(item);
                        break;
                      }
                    }
                  }
                }));
                defaultLogoImagePromises.push(this.resolveFieldGlobs('defaultLogoImage',configs[i],parsedConfigs[i],vParser).then((data)=>{
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedDefaultLogoImages = data.resolvedGlobs[j];
                    let extRegex = /png|tga|jpg|jpeg/i;
                    for (let k = 0; k < data.resolvedFiles[j].length; k++) {
                      const item = data.resolvedFiles[j][k];
                      if (extRegex.test(path.extname(item))) {
                        data.parsedConfig.files[j].defaultLogoImage = url.encodeFile(item);
                        break;
                      }
                    }
                  }
                }));

                localImagePromises.push(this.resolveFieldGlobs('localImages', configs[i], parsedConfigs[i], vParser).then((data) => {
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedLocalImages = data.resolvedGlobs[j];

                    let extRegex = /png|tga|jpg|jpeg/i;
                    data.parsedConfig.files[j].localImages = data.resolvedFiles[j].filter((item) => {
                      return extRegex.test(path.extname(item));
                    }).map((item) => {
                      return url.encodeFile(item);
                    });
                  }
                }));
                localTallImagePromises.push(this.resolveFieldGlobs('localTallImages', configs[i], parsedConfigs[i], vParser).then((data) => {
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedLocalTallImages = data.resolvedGlobs[j];

                    let extRegex = /png|tga|jpg|jpeg/i;
                    data.parsedConfig.files[j].localTallImages = data.resolvedFiles[j].filter((item) => {
                      return extRegex.test(path.extname(item));
                    }).map((item) => {
                      return url.encodeFile(item);
                    });
                  }
                }));
                localHeroImagePromises.push(this.resolveFieldGlobs('localHeroImages', configs[i], parsedConfigs[i], vParser).then((data) => {
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedLocalHeroImages = data.resolvedGlobs[j];

                    let extRegex = /png|tga|jpg|jpeg/i;
                    data.parsedConfig.files[j].localHeroImages = data.resolvedFiles[j].filter((item) => {
                      return extRegex.test(path.extname(item));
                    }).map((item) => {
                      return url.encodeFile(item);
                    });
                  }
                }));
                localLogoImagePromises.push(this.resolveFieldGlobs('localLogoImages', configs[i], parsedConfigs[i], vParser).then((data) => {
                  for (let j = 0; j < data.parsedConfig.files.length; j++) {
                    data.parsedConfig.files[j].resolvedLocalLogoImages = data.resolvedGlobs[j];

                    let extRegex = /png|tga|jpg|jpeg/i;
                    data.parsedConfig.files[j].localLogoImages = data.resolvedFiles[j].filter((item) => {
                      return extRegex.test(path.extname(item));
                    }).map((item) => {
                      return url.encodeFile(item);
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
              return Promise.all(localImagePromises).then(() => Promise.all(localTallImagePromises)).then(()=> Promise.all(localHeroImagePromises).then(()=> Promise.all(localLogoImagePromises))).then(() => Promise.all(localIconPromises)).then(() => Promise.all(defaultImagePromises)).then(() => Promise.all(defaultTallImagePromises)).then(()=>Promise.all(defaultHeroImagePromises)).then(()=>Promise.all(defaultLogoImagePromises));
            }).then(() => {
              let shortcutPromises: Promise<void>[] = [];
              if(os.type()=='Windows_NT') {
                for(let i=0; i < parsedConfigs.length; i++) {
                  if(parsedConfigs[i].shortcutPassthrough) {
                    for(let j=0; j < parsedConfigs[i].files.length; j++) {
                      if(parsedConfigs[i].files[j].filePath.split('.').slice(-1)[0].toLowerCase()=='lnk') {
                        shortcutPromises.push(getPath(parsedConfigs[i].files[j].filePath).then((actualPath: string)=>{
                        parsedConfigs[i].files[j].modifiedExecutableLocation = "\"".concat(actualPath,"\"");
                        parsedConfigs[i].files[j].startInDirectory = path.dirname(actualPath);
                        }))
                      }
                    }
                  }
                }
              }
              return Promise.all(shortcutPromises).then(()=>{
                return { parsedConfigs, noUserAccounts: totalUserAccountsFound === 0 };
              })
            });
          }

          private tryToReplaceTitlesWithVariables(data: ParsedDataWithFuzzy, config: UserConfiguration, vParser: VariableParser) {
            let groups = undefined;
            if (config.titleFromVariable.limitToGroups.length > 0) {
              groups = vParser.setInput(config.titleFromVariable.limitToGroups).parse() ? _.uniq(vParser.extractVariables(data => null)) : [];
              groups = _.intersection(Object.keys(this.variableData), groups);
            }
            else {
              groups = Object.keys(this.variableData);
            }

            if (groups.length > 0) {
              for (let i = 0; i < data.success.length; i++) {
                let found = false;
                for (let j = 0; j < groups.length; j++) {
                  if (config.titleFromVariable.caseInsensitiveVariables) {
                    for (let key in this.variableData[groups[j]]) {
                      if (data.success[i].extractedTitle.toLowerCase() === key.toLowerCase()) {
                        data.success[i].extractedTitle = this.variableData[groups[j]][key];
                        found = true;
                        break;
                      }
                    }
                  }
                  else if (this.variableData[groups[j]][data.success[i].extractedTitle] !== undefined) {
                    data.success[i].extractedTitle = this.variableData[groups[j]][data.success[i].extractedTitle];
                    found = true;
                  }
                  if (found)
                    break;
                }
                if (config.titleFromVariable.skipFileIfVariableWasNotFound && !found)
                  data.success[i].extractedTitle = '';
              }
            }
            else if (config.titleFromVariable.skipFileIfVariableWasNotFound) {
              for (let i = 0; i < data.success.length; i++) {
                data.success[i].extractedTitle = '';
              }
            }
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
                        if (this.fuzzyService.fuzzyMatcher.fuzzyMatchString(parsedData.success[j].extractedTitle, config.fuzzyMatch) === parsedConfig.files[i].fuzzyTitle) {
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
          private getEnvironmentVariable(variable: EnvironmentVariables) {
            let output = variable as string;
            switch (<EnvironmentVariables>variable.toUpperCase()) {
              case '/':
                output = path.sep;
                break;
              case 'SRMDIR':
                output = APP.srmdir;
                break;
            }
            return output;
          }

          private getVariable(variable: AllVariables, data: ParserVariableData) {
            const unavailable = 'undefined';
            let output = variable as string;
            switch (<AllVariables>variable.toUpperCase()) {
              case '/':
                output = path.sep;
                break;
              case 'SRMDIR':
                output = APP.srmdir;
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
                    let replaceText = match[4];
                    if (typeof replaceText === 'string') {
                      output = match[3].replace(regex, replaceText);
                    }
                    else {
                      let innerMatch = match[3].match(regex);
                      output = '';
                      if (innerMatch !== null) {
                        for (let i = 1; i < innerMatch.length; i++) {
                          if (innerMatch[i])
                            output += innerMatch[i];
                        }
                        if (output.length === 0)
                          output = innerMatch[0];
                      }
                    }
                    break;
                  }

                  match = /^uc\|(.*)$/i.exec(output);
                  if (match) {
                    output = match[1].toUpperCase();
                    break;
                  }

                  match = /^lc\|(.*)$/i.exec(output);
                  if (match) {
                    output = match[1].toLowerCase();
                    break;
                  }

                  match = /^rdc\|(.*)$/i.exec(output);
                  if (match) {
                    output = match[1].replaceDiacritics();
                    break;
                  }

                  match = /^cv:?(.*)\|(.+)$/i.exec(output);
                  if (match) {
                    let groups = match[1] ? _.intersection(Object.keys(this.variableData), match[1]) : Object.keys(this.variableData);
                    let found = false;
                    for (let i = 0; i < groups.length; i++) {
                      if (this.variableData[groups[i]][match[2]] !== undefined) {
                        output = match[2];
                        found = true;
                        break;
                      }
                    }
                    if (!found)
                      output = unavailable;
                    break;
                  }

                  match = /^os:(.+?)\|(.*?)(?:\|(.*?))?$/i.exec(output);
                  if (match) {
                    const regexPlatform = match[1].toLowerCase();
                    if (regexPlatform === "win" || regexPlatform === "mac" || regexPlatform === "linux") {
                      let platform: string = null;
                      switch (os.platform()) {
                        case "win32":
                          platform = "win";
                          break;
                        case "linux":
                          platform = "linux";
                          break;
                        case "darwin":
                          platform = "mac";
                          break;
                        default:
                          break;
                      }

                      if (platform !== null) {
                        output = ((platform === regexPlatform) ? match[2] : match[3]) || '';
                      }
                    }
                  }
                }
                break;
            }
            return output;
          }

          private makeVariableData(config: UserConfiguration, file: ParsedUserConfigurationFile) {
            return <ParserVariableData>{
              executableLocation: file.executableLocation,
              startInDirectory: file.startInDirectory,
              extractedTitle: file.extractedTitle,
              steamDirectory: config.steamDirectory,
              filePath: file.filePath,
              finalTitle: file.finalTitle,
              fuzzyTitle: file.fuzzyTitle,
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
