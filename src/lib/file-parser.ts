import { UserConfiguration, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData, ParserVariableData, AllVariables,isVariable, EnvironmentVariables,isEnvironmentVariable, CustomVariables, UserExceptions, UserExceptionsTitles, AppSettings } from '../models';
import { FuzzyService } from "../renderer/services";
import { VariableParser } from "./variable-parser";
import { APP } from '../variables';
import { parsers } from './parsers';
import * as parserInfo from './parsers/available-parsers';
import * as url from './helpers/url';
import * as steam from './helpers/steam';
import * as paths from "../paths";
import * as _ from 'lodash';
import { globPromise } from './helpers/glob/promise';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as Sentry from '@sentry/electron';
import { getPath } from 'windows-shortcuts-ps';


export class FileParser {
  private availableParsers = parsers;
  private customVariableData: CustomVariables = {};
  private userExceptions: UserExceptionsTitles = {};
  private globCache: any = {};

  constructor(private fuzzyService: FuzzyService) { }

  private get lang() {
    return APP.lang.fileParser;
  }

  setCustomVariables(data: CustomVariables) {
    this.customVariableData = data;
  }

  setUserExceptions(data: UserExceptions) {
    this.userExceptions = data.titles;
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
        error = this.availableParsers['Glob'].getParserInfo().inputs['glob'].validationFn(input.replace(match[0],'${'+match[1]+'}'), true);
      else
        error = this.availableParsers['Glob-regex'].getParserInfo().inputs['glob-regex'].validationFn(input.replace(match[0], '${'+match[1]+'}'), true);
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

  executeFileParser(configs: UserConfiguration[], settings: AppSettings) {
    let steamDirectories: { directory: string, useCredentials: boolean, data: userAccountData[] }[] = [];
    let totalUserAccountsFound: number = 0;
    let filteredAccounts: { found: userAccountData[], missing: string[] }[] = [];
    let parsedConfigs: ParsedUserConfiguration[] = [];
    this.globCache = {};

    return Promise.resolve()
    .then(() => {
      let preParser = new VariableParser({ left: '${', right: '}' });
      for (let i = 0; i < configs.length; i++) {
        let isArtworkOnlyParser:boolean = parserInfo.artworkOnlyParsers.includes(configs[i].parserType);
        let isPlatformParser:boolean = parserInfo.platformParsers.includes(configs[i].parserType);
        let isROMParser:boolean = parserInfo.ROMParsers.includes(configs[i].parserType);
        // Parse environment variables on rom directory, start in path, executable path
        configs[i].steamDirectory = preParser.setInput(configs[i].steamDirectory).parse() ? preParser.replaceVariables((variable) => {
          return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
        }) : null;
        if(isROMParser) {
          configs[i].romDirectory = preParser.setInput(configs[i].romDirectory).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
          configs[i].startInDirectory = preParser.setInput(configs[i].startInDirectory).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
          configs[i].executable.path = preParser.setInput(configs[i].executable.path).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
        }
      }
    })
    .then(()=>{
      for(let i = 0; i < configs.length; i++) {
        steamDirectories.push({ directory: configs[i].steamDirectory, useCredentials: configs[i].userAccounts.useCredentials, data: [] });
      }
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
    })
    .then(()=>{

      let promises: Promise<ParsedData>[] = [];
      for(let i=0; i<configs.length;i++) {
        let isArtworkOnlyParser:boolean = parserInfo.artworkOnlyParsers.includes(configs[i].parserType);
        let isPlatformParser:boolean = parserInfo.platformParsers.includes(configs[i].parserType);
        let isROMParser:boolean = parserInfo.ROMParsers.includes(configs[i].parserType);
        let parser = this.getParserInfo(configs[i].parserType);
        if (parser) {
          if (parser.inputs !== undefined) {
            for (var inputName in parser.inputs) {
              if (parser.inputs[inputName].forcedInput)
                configs[i].parserInputs[inputName] = parser.inputs[inputName].forcedInput;
              else if (configs[i].parserInputs[inputName] === undefined)
                configs[i].parserInputs[inputName] = '';
            }
          }
          let preParser = new VariableParser({ left: '${', right: '}' });
          let userFilter = preParser.setInput(configs[i].userAccounts.specifiedAccounts).parse() ? _.uniq(preParser.extractVariables(data => null)) : [];
          filteredAccounts.push(this.filterUserAccounts(steamDirectories[i].data, userFilter, configs[i].steamDirectory, configs[i].userAccounts.skipWithMissingDataDir));
          totalUserAccountsFound+=filteredAccounts[filteredAccounts.length-1].found.length;
          let directories = isROMParser ? [configs[i].romDirectory] : filteredAccounts[i].found.map((account: userAccountData)=>path.join(configs[i].steamDirectory,'userdata',account.accountID));
          promises.push(this.availableParsers[configs[i].parserType].execute(directories, configs[i].parserInputs, this.globCache));
        }
        else
          throw new Error(this.lang.error.parserNotFound__i.interpolate({ name: configs[i].parserType }));
      }
      return Promise.all(promises);
    })
    .then((data: ParsedDataWithFuzzy[]) => {
      let defaultImagePromises: Promise<void>[] = [];
      let defaultTallImagePromises: Promise<void>[] = [];
      let defaultHeroImagePromises: Promise<void>[] = [];
      let defaultLogoImagePromises: Promise<void>[] = [];
      let defaultIconPromises: Promise<void>[] = [];
      let localImagePromises: Promise<void>[] = [];
      let localTallImagePromises: Promise<void>[] = [];
      let localHeroImagePromises: Promise<void>[] = [];
      let localLogoImagePromises: Promise<void>[] = [];
      let localIconPromises: Promise<void>[] = [];
      let vParser = new VariableParser({ left: '${', right: '}' });
      for (let i = 0; i < configs.length; i++) {
        let isArtworkOnlyParser:boolean = parserInfo.artworkOnlyParsers.includes(configs[i].parserType);
        let isPlatformParser:boolean = parserInfo.platformParsers.includes(configs[i].parserType);
        let isROMParser:boolean = parserInfo.ROMParsers.includes(configs[i].parserType);
        let launcherMode = !!(configs[i].parserInputs.epicLauncherMode || configs[i].parserInputs.gogLauncherMode);
        if (isROMParser && configs[i].titleFromVariable.tryToMatchTitle)
          this.tryToReplaceTitlesWithVariables(data[i], configs[i], vParser);

        if (isROMParser && configs[i].fuzzyMatch.use)
          this.fuzzyService.fuzzyMatcher.fuzzyMatchParsedData(data[i], configs[i].fuzzyMatch);


        parsedConfigs.push({
          configurationTitle: configs[i].configTitle,
          parserId: configs[i].parserId,
          parserType: configs[i].parserType,
          appendArgsToExecutable: isROMParser ? configs[i].executable.appendArgsToExecutable: false,
          shortcutPassthrough: configs[i].executable.shortcutPassthrough,
          imageProviders: configs[i].imageProviders,
          foundUserAccounts: filteredAccounts[i].found,
          missingUserAccounts: filteredAccounts[i].missing,
          steamDirectory: configs[i].steamDirectory,
          files: [],
          failed: _.cloneDeep(data[i].failed),
          excluded: []
        });
        for (let j = 0; j < data[i].success.length; j++) {
          let fuzzyTitle = data[i].success[j].fuzzyTitle || data[i].success[j].extractedTitle;

          // Fail empty titles
          if (fuzzyTitle.length === 0) {
            parsedConfigs[i].failed.push(data[i].success[j].filePath);
            continue;
          }

          // Exclude user specified exclusions
          let exceptions = this.userExceptions[data[i].success[j].extractedTitle];
          if(exceptions && exceptions.exclude) {
            parsedConfigs[i].excluded.push(data[i].success[j].filePath);
            continue;
          }

          let executableLocation:string = undefined;
          let startInDir:string = undefined;
          let launchOptions:string = undefined;
          if(isROMParser) {
            executableLocation = configs[i].executable.path ? configs[i].executable.path : data[i].success[j].filePath;
            startInDir = configs[i].startInDirectory.length > 0 ? configs[i].startInDirectory : path.dirname(executableLocation);
          } else if(isPlatformParser) {
            startInDir = path.dirname(data[i].success[j].filePath);
            if(launcherMode) {
              executableLocation = data[i].executableLocation;
              launchOptions = data[i].success[j].launchOptions;
            } else {
              executableLocation = data[i].success[j].filePath;
            }
          } else if(isArtworkOnlyParser) {
            executableLocation = data[i].success[j].extractedAppId;
          }


          parsedConfigs[i].files.push({
            steamCategories: undefined,
            executableLocation: executableLocation,
            modifiedExecutableLocation: undefined,
            startInDirectory: startInDir,
            argumentString: undefined,
            resolvedLocalImages: [],
            resolvedLocalTallImages: [],
            resolvedLocalHeroImages: [],
            resolvedLocalLogoImages: [],
            resolvedLocalIcons: [],
            resolvedDefaultImages: [],
            resolvedDefaultTallImages: [],
            resolvedDefaultHeroImages: [],
            resolvedDefaultLogoImages: [],
            resolvedDefaultIcons: [],
            defaultImage: undefined,
            defaultTallImage: undefined,
            defaultHeroImage: undefined,
            defaultLogoImage: undefined,
            defaultIcon: undefined,
            localImages: [],
            localTallImages: [],
            localHeroImages: [],
            localLogoImages: [],
            localIcons: [],
            fuzzyTitle: fuzzyTitle,
            extractedTitle: data[i].success[j].extractedTitle,
            finalTitle: undefined,
            filePath: data[i].success[j].filePath,
            imagePool: undefined,
            onlineImageQueries: undefined
          });

          let lastFile = parsedConfigs[i].files[parsedConfigs[i].files.length - 1];
          let variableData = this.makeVariableData(configs[i],settings, lastFile);
          if(exceptions && exceptions.newTitle) {
            lastFile.finalTitle = exceptions.newTitle;
          } else {
            lastFile.finalTitle = vParser.setInput(configs[i].titleModifier).parse() ? vParser.replaceVariables((variable) => {
              return this.getVariable(variable as AllVariables, variableData).trim();
            }) : '';
          }
          variableData.finalTitle = lastFile.finalTitle;
          if(exceptions && exceptions.commandLineArguments) {
            lastFile.argumentString = exceptions.commandLineArguments;
          } else {
            if(isPlatformParser) {
              lastFile.argumentString = launchOptions || '';
            } else if(isROMParser) {
              lastFile.argumentString = vParser.setInput(configs[i].executableArgs).parse() ? vParser.replaceVariables((variable) => {
                return this.getVariable(variable as AllVariables, variableData).trim();
              }) : '';
            } else if(isArtworkOnlyParser) {
              lastFile.argumentString = '';
            }
          }
          lastFile.modifiedExecutableLocation = vParser.setInput(configs[i].executableModifier).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData).trim();
          }) : '';
          if(exceptions && exceptions.searchTitle) {
            lastFile.onlineImageQueries = [exceptions.searchTitle];
            lastFile.imagePool = exceptions.searchTitle;
          } else {
            lastFile.onlineImageQueries = vParser.setInput(configs[i].onlineImageQueries).parse() ? _.uniq(vParser.extractVariables((variable) => {
              return this.getVariable(variable as AllVariables, variableData);
            })) : [];
            lastFile.imagePool = vParser.setInput(configs[i].imagePool).parse() ? vParser.replaceVariables((variable) => {
              return this.getVariable(variable as AllVariables, variableData).trim();
            }) : '';
          }
          lastFile.steamCategories = vParser.setInput(configs[i].steamCategory).parse() ? _.uniq(vParser.extractVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData);
          })) : [];
        }


        let extRegex = /png|tga|jpg|jpeg/i;
        defaultImagePromises.push(this.resolveFieldGlobs('defaultImage', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedDefaultImages = data.resolvedGlobs[j];
            for (let k = 0; k < data.resolvedFiles[j].length; k++) {
              const item = data.resolvedFiles[j][k];
              if (extRegex.test(path.extname(item))) {
                data.parsedConfig.files[j].defaultImage = url.encodeFile(item);
                break;
              }
            }
          }
        }));
        defaultTallImagePromises.push(this.resolveFieldGlobs('defaultTallImage',configs[i],settings,parsedConfigs[i],vParser).then((data)=>{
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedDefaultTallImages = data.resolvedGlobs[j];
            for (let k = 0; k < data.resolvedFiles[j].length; k++) {
              const item = data.resolvedFiles[j][k];
              if (extRegex.test(path.extname(item))) {
                data.parsedConfig.files[j].defaultTallImage = url.encodeFile(item);
                break;
              }
            }
          }
        }));
        defaultHeroImagePromises.push(this.resolveFieldGlobs('defaultHeroImage',configs[i],settings,parsedConfigs[i],vParser).then((data)=>{
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedDefaultHeroImages = data.resolvedGlobs[j];
            for (let k = 0; k < data.resolvedFiles[j].length; k++) {
              const item = data.resolvedFiles[j][k];
              if (extRegex.test(path.extname(item))) {
                data.parsedConfig.files[j].defaultHeroImage = url.encodeFile(item);
                break;
              }
            }
          }
        }));
        defaultLogoImagePromises.push(this.resolveFieldGlobs('defaultLogoImage',configs[i],settings,parsedConfigs[i],vParser).then((data)=>{
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedDefaultLogoImages = data.resolvedGlobs[j];
            for (let k = 0; k < data.resolvedFiles[j].length; k++) {
              const item = data.resolvedFiles[j][k];
              if (extRegex.test(path.extname(item))) {
                data.parsedConfig.files[j].defaultLogoImage = url.encodeFile(item);
                break;
              }
            }
          }
        }));
        defaultIconPromises.push(this.resolveFieldGlobs('defaultIcon',configs[i],settings,parsedConfigs[i],vParser).then((data)=>{
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedDefaultIcons = data.resolvedGlobs[j];
            for (let k = 0; k < data.resolvedFiles[j].length; k++) {
              const item = data.resolvedFiles[j][k];
              if (extRegex.test(path.extname(item))) {
                data.parsedConfig.files[j].defaultIcon = url.encodeFile(item);
                break;
              }
            }
          }
        }));

        localImagePromises.push(this.resolveFieldGlobs('localImages', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedLocalImages = data.resolvedGlobs[j];
            data.parsedConfig.files[j].localImages = data.resolvedFiles[j].filter((item) => {
              return extRegex.test(path.extname(item));
            }).map((item) => {
              return url.encodeFile(item);
            });
          }
        }));
        localTallImagePromises.push(this.resolveFieldGlobs('localTallImages', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedLocalTallImages = data.resolvedGlobs[j];
            data.parsedConfig.files[j].localTallImages = data.resolvedFiles[j].filter((item) => {
              return extRegex.test(path.extname(item));
            }).map((item) => {
              return url.encodeFile(item);
            });
          }
        }));
        localHeroImagePromises.push(this.resolveFieldGlobs('localHeroImages', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedLocalHeroImages = data.resolvedGlobs[j];
            data.parsedConfig.files[j].localHeroImages = data.resolvedFiles[j].filter((item) => {
              return extRegex.test(path.extname(item));
            }).map((item) => {
              return url.encodeFile(item);
            });
          }
        }));
        localLogoImagePromises.push(this.resolveFieldGlobs('localLogoImages', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedLocalLogoImages = data.resolvedGlobs[j];
            data.parsedConfig.files[j].localLogoImages = data.resolvedFiles[j].filter((item) => {
              return extRegex.test(path.extname(item));
            }).map((item) => {
              return url.encodeFile(item);
            });
          }
        }));
        let iconextRegex = /png|ico|jpg|jpeg/i
        localIconPromises.push(this.resolveFieldGlobs('localIcons', configs[i],settings, parsedConfigs[i], vParser).then((data) => {
          for (let j = 0; j < data.parsedConfig.files.length; j++) {
            data.parsedConfig.files[j].resolvedLocalIcons = data.resolvedGlobs[j];
            data.parsedConfig.files[j].localIcons = data.resolvedFiles[j].filter((item)=>{
              return iconextRegex.test(path.extname(item));
            }).map((item)=> {
              return url.encodeFile(item);
            });
          }
        }));
      }
      return Promise.all(localImagePromises).then(() => Promise.all(localTallImagePromises)).then(()=> Promise.all(localHeroImagePromises).then(()=> Promise.all(localLogoImagePromises))).then(() => Promise.all(localIconPromises)).then(() => Promise.all(defaultImagePromises)).then(() => Promise.all(defaultTallImagePromises)).then(()=>Promise.all(defaultHeroImagePromises)).then(()=>Promise.all(defaultLogoImagePromises)).then(()=>Promise.all(defaultIconPromises));
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
      groups = _.intersection(Object.keys(this.customVariableData), groups);
    }
    else {
      groups = Object.keys(this.customVariableData);
    }
    if (groups.length > 0) {
      for (let i = 0; i < data.success.length; i++) {
        let found = false;
        for (let j = 0; j < groups.length; j++) {
          if (config.titleFromVariable.caseInsensitiveVariables) {
            for (let key in this.customVariableData[groups[j]]) {
              if (data.success[i].extractedTitle.toLowerCase() === key.toLowerCase()) {
                data.success[i].extractedTitle = this.customVariableData[groups[j]][key];
                found = true;
                break;
              }
            }
          }
          else if (this.customVariableData[groups[j]][data.success[i].extractedTitle] !== undefined) {
            data.success[i].extractedTitle = this.customVariableData[groups[j]][data.success[i].extractedTitle];
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
      data.found = _.cloneDeep(accountData);
    } else {
      data.found = accountData.filter((item)=>nameFilter.indexOf(item.name)>=0||nameFilter.indexOf(item.accountID)>=0)
      data.missing = nameFilter.filter((filt)=>data.found.map(item=>item.name).indexOf(filt)<0&&data.found.map(item=>item.accountID).indexOf(filt)<0);
      if(skipWithMissingDirectories) {
        data.found = data.found.filter((item)=>this.validatePath(path.join(steamDirectory,'userdata',item.accountID),true));
      }
    }
    return data;
  }

  private resolveFieldGlobs(field: string, config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration, vParser: VariableParser) {
    let promises: Promise<void>[] = [];
    let resolvedGlobs: string[][] = [];
    let resolvedFiles: string[][] = [];

    for (let i = 0; i < parsedConfig.files.length; i++) {
      resolvedGlobs.push([]);
      resolvedFiles.push([]);

      let fieldValue = config[field];
      if (fieldValue) {
        let variableData = this.makeVariableData(config,settings, parsedConfig.files[i]);
        //expandable set is to allow you to comment out stuff using $()$. Decent idea, but ehhhh
        let expandableSet = /\$\((\${.+?})(?:\|(.*?))?\)\$/.exec(fieldValue);
        let cwd = settings.environmentVariables.localImagesDirectory? settings.environmentVariables.localImagesDirectory : config.romDirectory;
        if (expandableSet === null) {
          let replacedGlob = path.resolve(cwd,vParser.setInput(fieldValue).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData);
          }) : '').replace(/\\/g, '/');

          resolvedGlobs[i].push(replacedGlob);
          promises.push(globPromise(replacedGlob, { silent: true, dot: true, realpath: true, cwd: cwd, cache: this.globCache }).then((files) => {
            resolvedFiles[i] = files;
          }));
        }
        else {
          let secondaryMatch: string = undefined;
          let parserMatch = fieldValue.replace(expandableSet[0], '$()$');
          parserMatch = vParser.setInput(parserMatch).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData);
          }) : '';
          parserMatch = path.resolve(cwd, parserMatch.replace('$()$', expandableSet[1])).replace(/\\/g, '/');
          resolvedGlobs[i].push(parserMatch);

          if (expandableSet[2] != undefined) {
            secondaryMatch = fieldValue.replace(expandableSet[0], expandableSet[2] || '');
            secondaryMatch = path.resolve(cwd, vParser.setInput(secondaryMatch).parse() ? vParser.replaceVariables((variable) => {
              return this.getVariable(variable as AllVariables, variableData);
            }) : '').replace(/\\/g, '/');
            resolvedGlobs[i].push(secondaryMatch);
          }

          promises.push(Promise.resolve().then(() => {
            if (/\${title}/i.test(expandableSet[1]))
            return this.availableParsers['Glob'].execute([cwd], { 'glob': parserMatch }, this.globCache);
            else
              return this.availableParsers['Glob-regex'].execute([cwd], { 'glob-regex': parserMatch }, this.globCache);
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
              return globPromise(secondaryMatch, { silent: true, dot: true, realpath: true, cwd: cwd, cache: this.globCache }).then((files) => {
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
  getEnvironmentVariable(variable: EnvironmentVariables, settings: AppSettings) {
    let output = variable as string;
    switch (<EnvironmentVariables>variable.toUpperCase()) {
      case '/':
        output = path.sep;
      break;
      case 'SRMDIR':
        output = APP.srmdir;
      break;
      case 'STEAMDIRGLOBAL':
        output=settings.environmentVariables.steamDirectory;
      break;
      case 'RETROARCHPATH':
        output=settings.environmentVariables.retroarchPath;
      break;
      case 'RACORES':
        output=settings.environmentVariables.raCoresDirectory;
      break;
      case 'LOCALIMAGESDIR':
        output=settings.environmentVariables.localImagesDirectory;
      break;
      default:
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
      case 'STEAMDIRGLOBAL':
        output=data.steamDirectoryGlobal;
      break;
      case 'RETROARCHPATH':
        output=data.retroarchPath;
      break;
      case 'RACORES':
        output=data.raCoresDirectory;
      break;
      case 'LOCALIMAGESDIR':
        output=data.localImagesDirectory;
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
          let groups = match[1] ? _.intersection(Object.keys(this.customVariableData), match[1]) : Object.keys(this.customVariableData);
          let found = false;
          for (let i = 0; i < groups.length; i++) {
            if (this.customVariableData[groups[i]][match[2]] !== undefined) {
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
    return output || '';
  }

  private makeVariableData(config: UserConfiguration, settings: AppSettings, file: ParsedUserConfigurationFile) {
    return <ParserVariableData>{
      executableLocation: file.executableLocation,
      startInDirectory: file.startInDirectory,
      extractedTitle: file.extractedTitle,
      steamDirectory: config.steamDirectory,
      filePath: file.filePath,
      finalTitle: file.finalTitle,
      fuzzyTitle: file.fuzzyTitle,
      romDirectory: config.romDirectory,
      steamDirectoryGlobal: settings.environmentVariables.steamDirectory,
      retroarchPath: settings.environmentVariables.retroarchPath,
      raCoresDirectory: settings.environmentVariables.raCoresDirectory,
      localImagesDirectory: settings.environmentVariables.localImagesDirectory
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
}
