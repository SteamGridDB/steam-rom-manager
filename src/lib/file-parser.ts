import { UserConfiguration, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData, ParserVariableData, AllVariables,isVariable, EnvironmentVariables,isEnvironmentVariable, CustomVariables, UserExceptions, UserExceptionsTitles, AppSettings } from '../models';
import { FuzzyService } from "../renderer/services";
import { VariableParser } from "./variable-parser";
import { APP } from '../variables';
import { parsers } from './parsers';
import * as parserInfo from './parsers/available-parsers';
import * as url from './helpers/url';
import * as steam from './helpers/steam';
import * as file from './helpers/file';
import { globPromise } from './helpers/glob/promise';
import * as paths from "../paths";
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { getPath, getArgs, getStartDir } from 'windows-shortcuts-ps';
import * as xdgparse from 'xdg-parse';


export class FileParser {
  private availableParsers = parsers;
  private customVariableData: CustomVariables = {};
  private userExceptions: UserExceptionsTitles = {};
  private globCache: any = {};

  constructor(private fuzzyService: FuzzyService) {  }

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

  executeFileParser(configs: UserConfiguration[], settings: AppSettings) {
    this.globCache = {};
    let configPromises: Promise<ParsedUserConfiguration>[] = [];
    for(let i=0; i < configs.length; i++) {
      let superType = parserInfo.superTypesMap[configs[i].parserType];
      configPromises.push(
        Promise.resolve({superType: superType, config: configs[i], settings: settings})
        .then(this.preParserPromise.bind(this))
        .then(this.steamDirectoriesPromise.bind(this))
        .then(this.parserPromise.bind(this))
        .then(this.linuxShortcutsPromise.bind(this))
        .then(this.fuzzyMatchPromise.bind(this))
        .then(this.buildParsedConfigsPromise.bind(this))
        .then(this.parsedConfigFilesPromise.bind(this))
        .then(this.shortcutsPromise.bind(this))
        .then(this.userExceptionsPromise.bind(this))
        .then(this.appendArgsPromise.bind(this))
        .then(this.imagesPromise.bind(this)) as Promise<ParsedUserConfiguration>
      )
    }
    return Promise.all(configPromises).then((parsedConfigs: ParsedUserConfiguration[])=>{
      let maxAccounts:number = Math.max(...parsedConfigs.map((x: ParsedUserConfiguration)=>x.foundUserAccounts.length));
      return { parsedConfigs, noUserAccounts: maxAccounts === 0 };
    }).catch((err) => {
      throw new Error(`File Parser Execution:\n ${err}`);
    });
  }

  private preParserPromise({superType, config, settings}: {superType: string, config: UserConfiguration, settings: AppSettings}) {
    return new Promise((resolve,reject)=>{
      try {
        let preParser = new VariableParser({ left: '${', right: '}' });
        // Parse environment variables on rom directory, start in path, executable path
        config.steamDirectory = preParser.setInput(config.steamDirectory).parse() ? preParser.replaceVariables((variable) => {
          return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
        }) : null;
        if(superType === parserInfo.ROMType) {
          config.romDirectory = preParser.setInput(config.romDirectory).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
          config.startInDirectory = preParser.setInput(config.startInDirectory).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
          config.executable.path = preParser.setInput(config.executable.path).parse() ? preParser.replaceVariables((variable) => {
            return this.getEnvironmentVariable(variable as EnvironmentVariables,settings).trim()
          }) : null;
        }
        let parser = this.getParserInfo(config.parserType);
        if (parser && parser.inputs) {
          for (var inputName in parser.inputs) {
            if (['dir','path'].includes(parser.inputs[inputName].inputType) && typeof(config.parserInputs[inputName])==='string') {
              config.parserInputs[inputName] = preParser.setInput(config.parserInputs[inputName] as string).parse() ? preParser.replaceVariables((variable) => {
                return this.getEnvironmentVariable(variable as EnvironmentVariables, settings).trim()
              }) : null;
            }
            if (parser.inputs[inputName].forcedInput) {
              config.parserInputs[inputName] = parser.inputs[inputName].forcedInput;
            }
            else if (config.parserInputs[inputName] === undefined) {
              config.parserInputs[inputName] = '';
            }
          }
        }
        resolve({superType: superType, config: config, settings: settings});
      } catch(e) {
        reject(`Preparser step for "${config.configTitle}":\n ${e}`)
      }
    })
  }

  private steamDirectoriesPromise({superType, config, settings}: {superType: string, config: UserConfiguration, settings: AppSettings}) {
    return new Promise((resolve, reject)=>{
      try {
        let steamDirectory: {directory: string, useCredentials: boolean, data: userAccountData[] } = {
          directory: config.steamDirectory,
          useCredentials: config.userAccounts.useCredentials,
          data: []
        };
        steam.getAvailableLogins(steamDirectory.directory, steamDirectory.useCredentials).then((data)=>{
          steamDirectory.data = data;
          resolve({superType: superType, config: config, settings: settings, steamDirectory: steamDirectory});
        }).catch((error)=>{ reject(error) });
      } catch(e) {
        reject(`Get steam directories step for "${config.configTitle}":\n ${e}`)
      }
    });
  }

  private parserPromise({superType, config, settings, steamDirectory}: {superType: string, config: UserConfiguration, settings: AppSettings, steamDirectory: {directory: string, useCredentials: boolean, data: userAccountData[] }}) {
    return new Promise((resolve, reject)=>{
      try {
        let parser = this.getParserInfo(config.parserType);
        if (parser) {
          let preParser = new VariableParser({ left: '${', right: '}' });
          let userFilter = preParser.setInput(config.userAccounts.specifiedAccounts).parse() ? _.uniq(preParser.extractVariables(data => null)) : [];
          let filteredAccounts: { found: userAccountData[], missing: string[] } = this.filterUserAccounts(steamDirectory.data, userFilter, config.steamDirectory, config.userAccounts.skipWithMissingDataDir);
          let directories:string[] = undefined;
          if (superType === parserInfo.ROMType) {
            directories = [config.romDirectory];
          }
          else if (superType === parserInfo.ManualType) {
            directories = [config.parserInputs["manualManifests"] as string];
          }
          else {
            directories = filteredAccounts.found.map((account: userAccountData) => path.join(config.steamDirectory, 'userdata', account.accountID));
          }
          this.availableParsers[config.parserType].execute(directories, config.parserInputs, this.globCache)
            .then((data: ParsedDataWithFuzzy) => {
              resolve({superType: superType, config: config, settings: settings, data: data, filteredAccounts: filteredAccounts})
            }).catch((error) =>{ reject(error) });
        }
        else {
          reject(this.lang.error.parserNotFound__i.interpolate({ name: config.parserType }));
        }
      } catch (e) {
        reject(`Execute all parsers step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private linuxShortcutsPromise({superType, config, settings, data, filteredAccounts}: {superType: string, config: UserConfiguration, settings: AppSettings, data: ParsedDataWithFuzzy, filteredAccounts: { found: userAccountData[], missing: string[] }}) {
    return new Promise((resolve, reject) => {
      try {
        let shortcutPromises: Promise<void>[] = [];
        if(superType === parserInfo.ROMType && config.executable.shortcutPassthrough && os.type() == 'Linux') {
          let targetPath: string = undefined;
          for(let j = 0; j < data.success.length; j++) {
            if(path.extname(data.success[j].filePath).toLowerCase() === '.desktop') {
              let shortcutPromise: Promise<void> = fs.promises.open(data.success[j].filePath, 'r')
                .then(filehandle => {
                  return filehandle.readFile("utf8");
                }).then((fileData) => {
                  let entry = xdgparse.parse(fileData)["Desktop Entry"];
                  data.success[j].extractedTitle = entry["Name"];
                })
              shortcutPromises.push(shortcutPromise);
            }
          }
        }
        Promise.all(shortcutPromises).then(()=>{
          resolve({ superType: superType, config: config, settings: settings, data:data, filteredAccounts:filteredAccounts })
        }).catch((error)=>{
          reject(`Linux shortcuts step for "${config.configTitle}":\n ${error}`);
        })
      } catch(e) {
        reject(`Linux shortcuts step for "${config.configTitle}":\n ${e}`);
      }
    });
  }


  private fuzzyMatchPromise({superType, config, settings, data, filteredAccounts}: {superType: string, config: UserConfiguration, settings: AppSettings, data: ParsedDataWithFuzzy, filteredAccounts: { found: userAccountData[], missing: string[] }}) {
    return new Promise((resolve, reject) => {
      try {
        let vParser = new VariableParser({ left: '${', right: '}' });
        if (superType === parserInfo.ROMType || superType === parserInfo.ManualType) {
          if(config.titleFromVariable.tryToMatchTitle) {
            this.tryToReplaceTitlesWithVariables(data, config, vParser);
          }
          this.fuzzyService.fuzzyMatcher.fuzzyMatchParsedData(data, config.fuzzyMatch);
        }
        resolve({superType: superType, config: config, settings: settings, data: data, filteredAccounts: filteredAccounts});
      } catch(e) {
        reject(`Fuzzy matching step for "${config.configTitle}":\n ${e}`);
      }
    });
  }
  private buildParsedConfigsPromise({superType, config, settings, data, filteredAccounts}: {superType: string, config: UserConfiguration, settings: AppSettings, data: ParsedDataWithFuzzy, filteredAccounts: { found: userAccountData[], missing: string[] }}) {
    return new Promise((resolve,reject) => {
      try {
        let parsedConfig: ParsedUserConfiguration = {
          configurationTitle: config.configTitle,
          parserId: config.parserId,
          parserType: config.parserType,
          appendArgsToExecutable: superType === parserInfo.ROMType ? config.executable.appendArgsToExecutable: false,
          shortcutPassthrough: config.executable.shortcutPassthrough,
          imageProviders: config.imageProviders,
          imageProviderAPIs: config.imageProviderAPIs,
          controllers: config.controllers,
          foundUserAccounts: filteredAccounts.found,
          missingUserAccounts: filteredAccounts.missing,
          steamDirectory: config.steamDirectory,
          files: [],
          failed: _.cloneDeep(data.failed),
          excluded: []
        };
        resolve({superType: superType, config: config, settings:settings, data:data, parsedConfig: parsedConfig})
      } catch(e) {
        reject(`Initialize parsed configs step for "${config.configTitle}":\n ${e}`);
      }
    })
  }
  private parsedConfigFilesPromise({superType, config, settings, data, parsedConfig}: {superType: string, config: UserConfiguration, settings: AppSettings, data: ParsedDataWithFuzzy, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject) => {
      try {
        let vParser = new VariableParser({ left: '${', right: '}' });
        let launcherMode = !!(
          config.parserInputs.epicLauncherMode
          || config.parserInputs.gogLauncherMode
          || config.parserInputs.amazonGamesLauncherMode
          || config.parserInputs.uplayLauncherMode
        );
        for(let j=0; j < data.success.length; j++) {
          let fuzzyTitle = data.success[j].fuzzyTitle || data.success[j].extractedTitle;

          // Fail empty titles
          if (fuzzyTitle.length === 0) {
            parsedConfig.failed.push(data.success[j].filePath);
            continue;
          }

          let executableLocation:string = undefined;
          let startInDir:string = undefined;

          if (superType === parserInfo.ManualType) {
            executableLocation = data.success[j].filePath;
            startInDir = data.success[j].startInDirectory || path.dirname(executableLocation);
          }
          else if(superType === parserInfo.ROMType) {
            executableLocation = config.executable.path || data.success[j].filePath;
            startInDir = config.startInDirectory || path.dirname(executableLocation);
          }
          else if(superType === parserInfo.PlatformType) {
            if(launcherMode) {
              executableLocation = data.executableLocation;
            } else {
              executableLocation = data.success[j].filePath;
            }
            startInDir = data.success[j].startInDirectory || path.dirname(data.success[j].filePath);
          }
          else if(superType === parserInfo.ArtworkOnlyType) {
            executableLocation = data.success[j].extractedAppId;
            startInDir = '';
          }
          let newFile: ParsedUserConfigurationFile = {
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
            extractedTitle: data.success[j].extractedTitle,
            finalTitle: undefined,
            filePath: data.success[j].filePath,
            imagePool: undefined,
            onlineImageQueries: undefined
          };

          let variableData = this.makeVariableData(config, settings, newFile);

          newFile.finalTitle = vParser.setInput(config.titleModifier).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData).trim();
          }) : '';

          variableData.finalTitle = newFile.finalTitle;

          if (superType === parserInfo.ManualType) {
            newFile.argumentString = data.success[j].launchOptions || '';
          }
          else if (superType === parserInfo.ROMType) {
            newFile.argumentString = vParser.setInput(config.executableArgs).parse() ? vParser.replaceVariables((variable) => {
              return this.getVariable(variable as AllVariables, variableData).trim();
            }) : '';
          }
          else if (superType === parserInfo.PlatformType) {
            newFile.argumentString = launcherMode ? data.success[j].launchOptions || '' : '';
          }
          else if (superType === parserInfo.ArtworkOnlyType) {
            newFile.argumentString = '';
          }
          newFile.modifiedExecutableLocation = vParser.setInput(config.executableModifier).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData).trim();
          }) : '';
          newFile.onlineImageQueries = vParser.setInput(config.onlineImageQueries).parse() ? _.uniq(vParser.extractVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData);
          })) : [];
          newFile.imagePool = vParser.setInput(config.imagePool).parse() ? vParser.replaceVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData).trim();
          }) : '';
          newFile.steamCategories = vParser.setInput(config.steamCategory).parse() ? _.uniq(vParser.extractVariables((variable) => {
            return this.getVariable(variable as AllVariables, variableData);
          })) : [];

          parsedConfig.files.push(newFile);
        }
        resolve({superType: superType, config: config, settings: settings, parsedConfig: parsedConfig})
      } catch(e) {
        reject(`Add parsed files step for "${config.configTitle}":\n ${e}`);
      }
    })
  }

  private shortcutsPromise({superType, config, settings, parsedConfig}: {superType: string, config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject)=>{
      try {
        let shortcutPromises: Promise<void>[] = [];
        if(superType === parserInfo.ROMType && parsedConfig.shortcutPassthrough && os.type() == 'Windows_NT') {
          let targetPath: string = undefined;
          for(let j = 0; j < parsedConfig.files.length; j++) {
            if(path.extname(parsedConfig.files[j].filePath).toLowerCase() === '.lnk') {
              let shortcutPromise: Promise<void> = getPath(parsedConfig.files[j].filePath)
                .then((actualPath: string)=>{
                  targetPath = actualPath;
                  parsedConfig.files[j].modifiedExecutableLocation = "\"".concat(actualPath,"\"");
                })
                .then(() => getStartDir(parsedConfig.files[j].filePath))
                .then((startInDir: string) => {
                  parsedConfig.files[j].startInDirectory = startInDir || path.dirname(targetPath);
                })
                .then(() => getArgs(parsedConfig.files[j].filePath))
                .then((shortcutArgs: string) => {
                  parsedConfig.files[j].argumentString = shortcutArgs || "";
                })

              shortcutPromises.push(shortcutPromise)
            }
          }
        }
        if(superType === parserInfo.ROMType && parsedConfig.shortcutPassthrough && os.type() == 'Linux') {
          let targetPath: string = undefined;
          for(let j = 0; j < parsedConfig.files.length; j++) {
            if(path.extname(parsedConfig.files[j].filePath).toLowerCase() === '.desktop') {
              let shortcutPromise: Promise<void> = fs.promises.open(parsedConfig.files[j].filePath, 'r')
                .then(filehandle => {
                  return filehandle.readFile("utf8");
                }).then(data => {
                  let entry = xdgparse.parse(data)["Desktop Entry"];
                  let splitExec = String(entry["Exec"]).match(/(?:(?:\S*\\\s)+|(?:[^\s"]+|"[^"]*"))+/g);
                  let modifiedExecutableLocation = splitExec.shift();
                  parsedConfig.files[j].modifiedExecutableLocation = modifiedExecutableLocation;
                  parsedConfig.files[j].startInDirectory = (entry["Path"] && String(entry["Path"])) || path.dirname(modifiedExecutableLocation);
                  parsedConfig.files[j].argumentString = splitExec.join(' ');
                })
              shortcutPromises.push(shortcutPromise);
            }
          }
        }
        Promise.all(shortcutPromises).then(()=>{
          resolve({ superType: superType, config: config, settings: settings, parsedConfig: parsedConfig })
        }).catch((error)=>{
          reject(`Shortcut passthrough step for "${config.configTitle}":\n ${error}`);
        })
      } catch(e) {
        reject(`Shortcut passthrough step for "${config.configTitle}":\n ${e}`);
      }
    })
  }

  private userExceptionsPromise({superType, config, settings, parsedConfig}: {superType: string, config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve,reject)=>{
      try {
        for(let j=0; j < parsedConfig.files.length; j++) {
          let exceptions = this.userExceptions[parsedConfig.files[j].extractedTitle];
          if(exceptions && exceptions.exclude) {
            parsedConfig.excluded.push(parsedConfig.files[j].filePath);
            parsedConfig.files[j] = null;
            continue;
          }
          if(exceptions && exceptions.newTitle) {
            parsedConfig.files[j].finalTitle = exceptions.newTitle;
          }
          if(exceptions && exceptions.commandLineArguments) {
            parsedConfig.files[j].argumentString = exceptions.commandLineArguments;
          }
          if(exceptions && exceptions.searchTitle) {
            parsedConfig.files[j].onlineImageQueries = [exceptions.searchTitle];
            parsedConfig.files[j].imagePool = exceptions.searchTitle;
          }
        }
        parsedConfig.files = parsedConfig.files.filter(x=>!!x);
        resolve({ config: config, settings: settings, parsedConfig: parsedConfig });
      } catch(e) {
        reject(`Apply user exceptions step for ${config.configTitle}:\n ${e}`);
      }
    })
  }

  private appendArgsPromise({config, settings, parsedConfig}: {config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject)=>{
      try{
        for(let j=0; j< parsedConfig.files.length; j++) {
          if(config.executable.appendArgsToExecutable) {
            parsedConfig.files[j].modifiedExecutableLocation = `${parsedConfig.files[j].modifiedExecutableLocation} ${parsedConfig.files[j].argumentString}`;
            parsedConfig.files[j].argumentString = '';
          }
          parsedConfig.files[j].modifiedExecutableLocation = parsedConfig.files[j].modifiedExecutableLocation.trim();
        }
        resolve({ config: config, settings: settings, parsedConfig: parsedConfig });
      } catch(e) {
        reject(`Append args to executable step for ${config.configTitle}:\n ${e}`);
      }
    })
  }

  private imagesPromise({config, settings, parsedConfig}: {config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject) => {
      try {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        let defaultPromises: Promise<void>[] = [];
        let localPromises: Promise<void>[]=[];
        let imageTypes = ["Image","TallImage","HeroImage","LogoImage","Icon"];
        let defaultFields = imageTypes.map((x: string) => "default".concat(x));
        let defaultFieldsRes = imageTypes.map((x: string) => "resolvedDefault".concat(x,"s"));
        let localFields = imageTypes.map((x: string) => "local".concat(x, "s"));
        let localFieldsRes = imageTypes.map((x: string) => "resolvedLocal".concat(x,"s"));
        let vParser = new VariableParser({ left: '${', right: '}' });
        for(let m = 0; m < imageTypes.length; m++) {
          defaultPromises.push(
            this.resolveFieldGlobs(defaultFields[m], config, settings, parsedConfig, vParser).then((fieldData)=>{
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j][defaultFieldsRes[m]] = fieldData.resolvedGlobs[j];
                for (let k = 0; k < fieldData.resolvedFiles[j].length; k++) {
                  const item = fieldData.resolvedFiles[j][k];
                  if (extRegex.test(path.extname(item))) {
                    parsedConfig.files[j][defaultFields[m]] = url.encodeFile(item);
                    break;
                  }
                }
              }
            })
          )
          localPromises.push(
            this.resolveFieldGlobs(localFields[m], config,settings, parsedConfig, vParser).then((fieldData) => {
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j][localFieldsRes[m]] = fieldData.resolvedGlobs[j];
                parsedConfig.files[j][localFields[m]] = fieldData.resolvedFiles[j].filter((item) => {
                  return extRegex.test(path.extname(item));
                }).map((item) => {
                  return url.encodeFile(item);
                });
              }
            })
          )
        }
        Promise.all(localPromises).then(()=>Promise.all(defaultPromises)).then(()=>{
          resolve(parsedConfig)
        })
      } catch(e) {
        reject(`Resolve images step for "${config.configTitle}":\n ${e}`)
      }
    })
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
      data.missing = nameFilter.filter((filt)=>data.found.map(item=>item.name).indexOf(filt) < 0&&data.found.map(item=>item.accountID).indexOf(filt) < 0);
      if(skipWithMissingDirectories) {
        data.found = data.found.filter((item)=>file.validatePath(path.join(steamDirectory,'userdata',item.accountID),true));
      }
    }
    return data;
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
            if (/\${title}/i.test(expandableSet[1])) {
              return this.availableParsers['Glob'].execute([cwd], { 'glob': parserMatch }, this.globCache).then((parsedData)=>{
                return {parsedData: parsedData, isFuzzy: false}
              });
            }
            else if (/\${fuzzyTitle}/i.test(expandableSet[1])) {
              parserMatch = parserMatch.replace('${fuzzyTitle}','${title}')
              return this.availableParsers['Glob'].execute([cwd], { 'glob': parserMatch }, this.globCache).then((parsedData)=>{
                return {parsedData: parsedData, isFuzzy: true}
              });
            }
            else {
              return this.availableParsers['Glob'].execute([cwd], { 'glob': parserMatch }, this.globCache).then((parsedData)=>{
                return {parsedData: parsedData, isFuzzy: false}
              });

            }
          }).then((data) => {
            let parsedData = data.parsedData;
            let isFuzzy = data.isFuzzy;
            for (let j = 0; j < parsedData.success.length; j++) {
              if (isFuzzy && parsedData.success[j].extractedTitle === parsedConfig.files[i].fuzzyTitle) {
                resolvedFiles[i].push(parsedData.success[j].filePath);
              }
              else if (!isFuzzy && parsedData.success[j].extractedTitle === parsedConfig.files[i].extractedTitle) {
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
      case 'ROMSDIRGLOBAL':
        output=settings.environmentVariables.romsDirectory;
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
      case 'ROMSDIRGLOBAL':
        output=data.romsDirectoryGlobal;
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
      romsDirectoryGlobal: settings.environmentVariables.romsDirectory,
      retroarchPath: settings.environmentVariables.retroarchPath,
      raCoresDirectory: settings.environmentVariables.raCoresDirectory,
      localImagesDirectory: settings.environmentVariables.localImagesDirectory
    }
  }
}
