import { UserConfiguration, ParsedUserConfiguration, ParsedData, ParsedUserConfigurationFile, ParsedDataWithFuzzy, userAccountData, ParserVariableData, AllVariables,isVariable, EnvironmentVariables,isEnvironmentVariable, CustomVariables, UserExceptions, UserExceptionData, UserExceptionsTitles, AppSettings, ParserType } from '../models';
import { FuzzyService } from "../renderer/services";
import { VariableParser } from "./variable-parser";
import { APP } from '../variables';
import { parsers } from './parsers';
import * as parserInfo from './parsers/available-parsers';
import { artworkTypes } from './artwork-types';
import * as url from './helpers/url';
import * as steam from './helpers/steam';
import * as file from './helpers/file';
import * as paths from "../paths";
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { glob, escape } from 'glob';
import { getPath, getArgs, getStartDir } from 'windows-shortcuts-ps';
import * as xdgparse from 'xdg-parse';
import { SteamGridDbProvider } from './image-providers/steamgriddb.worker';




export class FileParser {
  private availableParsers = parsers;
  private customVariableData: CustomVariables = {};
  private userExceptions: UserExceptionsTitles = {};

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

  getParserInfo(key: ParserType) {
    return this.availableParsers[key] ? this.availableParsers[key].getParserInfo() : undefined;
  }

  executeFileParser(configs: UserConfiguration[], settings: AppSettings) {
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
        .then(this.appendArgsPromise.bind(this))
        .then(this.userExceptionsPromise.bind(this))
        .then(this.imagesPromise.bind(this)) 
        .then(this.backedUpLocalImagesPromise.bind(this)) as Promise<ParsedUserConfiguration>
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
        const doubleVarRegex = /^\$\{\$\{.+\}\}$/;
        if(doubleVarRegex.test(config.userAccounts.specifiedAccounts)) {
          config.userAccounts.specifiedAccounts = preParser.setInput(config.userAccounts.specifiedAccounts).parse() ? preParser.replaceVariables((variable)=>{
            return this.getEnvironmentVariable(variable as EnvironmentVariables, settings).trim();
          }): null;
        }
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
        let steamDirectory: {directory: string, data: userAccountData[] } = {
          directory: config.steamDirectory,
          data: []
        };
        steam.getAvailableLogins(steamDirectory.directory).then((data)=>{
          steamDirectory.data = data;
          resolve({superType: superType, config: config, settings: settings, steamDirectory: steamDirectory});
        }).catch((error)=>{ reject(error) });
      } catch(e) {
        reject(`Get steam directories step for "${config.configTitle}":\n ${e}`)
      }
    });
  }

  private parserPromise({superType, config, settings, steamDirectory}: {superType: string, config: UserConfiguration, settings: AppSettings, steamDirectory: {directory: string, data: userAccountData[] }}) {
    return new Promise((resolve, reject)=>{
      try {
        let parser = this.getParserInfo(config.parserType);
        if (parser) {
          let preParser = new VariableParser({ left: '${', right: '}' });
          let userFilter = preParser.setInput(config.userAccounts.specifiedAccounts).parse() ? _.uniq(preParser.extractVariables(data => null)) : [];
          let filteredAccounts: { found: userAccountData[], missing: string[] } = this.filterUserAccounts(steamDirectory.data, userFilter, config.steamDirectory);
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
          this.availableParsers[config.parserType].execute(directories, config.parserInputs)
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
          shortcutPassthrough: config.executable.shortcutPassthrough,
          imageProviders: config.imageProviders,
          drmProtect: config.drmProtect,
          imageProviderAPIs: config.imageProviderAPIs,
          steamInputEnabled: config.steamInputEnabled,
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
          || config.parserInputs.UWPLauncherMode
          || config.parserInputs.eaLauncherMode
          || config.parserType==='Battle.net'
        );
        for(let j = 0; j < data.success.length; j++) {
          let fuzzyTitle = data.success[j].fuzzyTitle || data.success[j].extractedTitle;

          // Fail empty titles
          if (fuzzyTitle.length === 0) {
            parsedConfig.failed.push(data.success[j].filePath);
            continue;
          }

          let executableLocation:string = undefined;
          let startInDir:string = undefined;
          let appendArgsToExecutable:boolean = undefined;

          if (superType === parserInfo.ManualType) {
            executableLocation = data.success[j].filePath;
            startInDir = data.success[j].startInDirectory || path.dirname(executableLocation);
            appendArgsToExecutable = data.success[j].appendArgsToExecutable;
          }
          else if(superType === parserInfo.ROMType) {
            executableLocation = config.executable.path || data.success[j].filePath;
            startInDir = config.startInDirectory || path.dirname(executableLocation);
            appendArgsToExecutable = config.executable.appendArgsToExecutable;
          }
          else if(superType === parserInfo.PlatformType) {
            if(launcherMode) {
              executableLocation = data.executableLocation;
            } else {
              executableLocation = data.success[j].filePath;
            }
            startInDir = data.success[j].startInDirectory || path.dirname(data.success[j].filePath);
            appendArgsToExecutable = false;
          }
          else if(superType === parserInfo.ArtworkOnlyType) {
            executableLocation = data.success[j].extractedAppId;
            startInDir = '';
            appendArgsToExecutable = false;
          }

          let newFile: ParsedUserConfigurationFile = {
            steamCategories: undefined,
            executableLocation: executableLocation||'',
            modifiedExecutableLocation: undefined,
            startInDirectory: startInDir||'',
            argumentString: undefined,
            appendArgsToExecutable: appendArgsToExecutable,
            resolvedLocalImages: Object.fromEntries(artworkTypes.map((artworkType) => [artworkType,[]])),
            resolvedDefaultImages: Object.fromEntries(artworkTypes.map((artworkType) => [artworkType,[]])),
            defaultImage: Object.fromEntries(artworkTypes.map((artworkType: string) => [artworkType, undefined])),
            localImages: Object.fromEntries(artworkTypes.map((artworkType) => [artworkType,[]])),
            fuzzyTitle: fuzzyTitle||'',
            extractedTitle: data.success[j].extractedTitle||'',
            finalTitle: undefined,
            filePath: data.success[j].filePath||'',
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
            newFile.argumentString = launcherMode ? data.success[j].launchOptions || '' : data.success[j].fileLaunchOptions||'';
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
          let indices: number[] = []; let shortcutPaths: string[] = [];
          for(let i = 0; i < parsedConfig.files.length; i++) {
            if(path.extname(parsedConfig.files[i].filePath).toLowerCase() === '.lnk') {
              indices.push(i);
              shortcutPaths.push(parsedConfig.files[i].filePath)
            }
          }
          shortcutPromises.push(
            getPath(shortcutPaths)
            .then((actuals: string[]) => {
              return getStartDir(shortcutPaths).then((starts:string[]) => {return {actuals: actuals, starts: starts}})
            })
            .then(({actuals, starts}: {actuals: string[], starts: string[]}) => {
              return getArgs(shortcutPaths).then((args:string[]) => {return {actuals: actuals, starts: starts, args: args}})
            })
            .then(({actuals, starts, args}: {actuals: string[], starts: string[], args: string[]}) => {
              for(let i = 0; i < indices.length; i++) {
                let index = indices[i];
                parsedConfig.files[index].modifiedExecutableLocation = `"${actuals[i]}"`;
                parsedConfig.files[index].startInDirectory = starts[i] || path.dirname(actuals[i]);
                parsedConfig.files[index].argumentString = args[i] || "";
              }
            })
          )
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
        Promise.all(shortcutPromises).then(() => {
          resolve({ superType: superType, config: config, settings: settings, parsedConfig: parsedConfig })
        }).catch((error)=>{
          reject(`Shortcut passthrough step for "${config.configTitle}":\n ${error}`);
        })
      } catch(e) {
        reject(`Shortcut passthrough step for "${config.configTitle}":\n ${e}`);
      }
    })
  }

  private appendArgsPromise({superType, config, settings, parsedConfig}: {superType: string, config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject)=>{
      try{
        for(let j=0; j < parsedConfig.files.length; j++) {
          if(parsedConfig.files[j].appendArgsToExecutable) {
            parsedConfig.files[j].modifiedExecutableLocation = `${parsedConfig.files[j].modifiedExecutableLocation} ${parsedConfig.files[j].argumentString}`;
            parsedConfig.files[j].argumentString = '';
          }
          parsedConfig.files[j].modifiedExecutableLocation = parsedConfig.files[j].modifiedExecutableLocation.trim();
        }
        resolve({ superType: superType, config: config, settings: settings, parsedConfig: parsedConfig });
      } catch(e) {
        reject(`Append args to executable step for ${config.configTitle}:\n ${e}`);
      }
    })
  }

  private userExceptionsPromise({superType, config, settings, parsedConfig}: {superType: string, config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {

    return new Promise((resolve,reject)=>{
      try {
        const appIdRegex: RegExp = /\$\{id\:([0-9]*?)\}/;
        for(let j=0; j < parsedConfig.files.length; j++) {

          // This little bit of magic means that we can also match on Exception ID
          let shortAppId: string;
          if(superType === parserInfo.ArtworkOnlyType) {
            shortAppId = parsedConfig.files[j].modifiedExecutableLocation.replace(/\"/g,"");
          } else {
            shortAppId = steam.generateShortAppId(parsedConfig.files[j].modifiedExecutableLocation, parsedConfig.files[j].extractedTitle);
          }
          const exceptionMatches = Object.entries(this.userExceptions).filter(([extractedTitle, exception]: [extractedTitle: string, exception: UserExceptionData]) => {
            if(appIdRegex.test(extractedTitle)) {
              return extractedTitle.match(appIdRegex)[1] == shortAppId;
            } else {
              return extractedTitle == parsedConfig.files[j].extractedTitle;
            }
          }).map(x=>x[1]);

          if(exceptionMatches.length) {
            const exceptions = exceptionMatches[0];
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
            if(exceptions && !exceptions.excludeArtwork && exceptions.searchTitle) {
              parsedConfig.files[j].onlineImageQueries = [exceptions.searchTitle];
              parsedConfig.files[j].imagePool = exceptions.searchTitle;
            }
            if(exceptions && exceptions.excludeArtwork) {
              parsedConfig.files[j].onlineImageQueries = [];
            }
          }
        }
        parsedConfig.files = parsedConfig.files.filter(x=>!!x);
        resolve({ config: config, settings: settings, parsedConfig: parsedConfig });
      } catch(e) {
        reject(`Apply user exceptions step for ${config.configTitle}:\n ${e}`);
      }
    })
  }

  private imagesPromise({config, settings, parsedConfig}: {config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration}) {
    return new Promise((resolve, reject) => {
      try {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        let defaultPromises: Promise<void>[] = [];
        let localPromises: Promise<void>[]=[];
        let vParser = new VariableParser({ left: '${', right: '}' });
        for(const artworkType of artworkTypes) {
          defaultPromises.push(
            this.resolveFieldGlobs(['defaultImage', artworkType], config, settings, parsedConfig, vParser).then((fieldData)=>{
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j].resolvedDefaultImages[artworkType] = fieldData.resolvedGlobs[j];
                for (let k = 0; k < fieldData.resolvedFiles[j].length; k++) {
                  const item = fieldData.resolvedFiles[j][k];
                  if (extRegex.test(path.extname(item))) {
                    parsedConfig.files[j].defaultImage[artworkType] = url.encodeFile(item);
                    break;
                  }
                }
              }
            })
          )
          localPromises.push(
            this.resolveFieldGlobs(['localImages', artworkType], config,settings, parsedConfig, vParser).then((fieldData) => {
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j].resolvedLocalImages[artworkType] = fieldData.resolvedGlobs[j];
                parsedConfig.files[j].localImages[artworkType] = fieldData.resolvedFiles[j].filter((item) => {
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
  private backedUpLocalImagesPromise(parsedConfig: ParsedUserConfiguration) {
    return new Promise((resolve, reject)=>{
      try {
        let backedupPromises: Promise<void>[] = [];
        if(parsedConfig.drmProtect) {
          for(let j=0; j < parsedConfig.files.length; j++) {
            const finalTitle = parsedConfig.files[j].finalTitle;
            for(const artworkType of artworkTypes) {
              if(parsedConfig.files[j].onlineImageQueries.length) {
                backedupPromises.push(SteamGridDbProvider.retrieveIdsFromTitle(parsedConfig.files[j].onlineImageQueries[0]).then((possibleGameIds: number[])=>{
                  if(possibleGameIds.length) {
                      const backupDir = path.join(paths.userDataDir,'artworkBackups', artworkType);
                      return glob(`${possibleGameIds[0]}.*`, {dot: true, cwd: backupDir, absolute: true}).then((localBackups: string[])=>{
                        for(let localBackup of localBackups) {
                          parsedConfig.files[j].localImages[artworkType].unshift(url.encodeFile(localBackup))
                        }
                      });
                    }
                  }))
              }
            }
          }
        }
        Promise.all(backedupPromises).then(()=>{
          resolve(parsedConfig)
        })
      } catch(e) {
        reject(`Backed up images step for "${parsedConfig.configurationTitle}":\n ${e}`)
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

  private filterUserAccounts(accountData: userAccountData[], nameFilter: string[], steamDirectory: string) {
    let data: { found: userAccountData[], missing: string[] } = { found: [], missing: [] };
    if (nameFilter.length === 0) {
      data.found = _.cloneDeep(accountData);
    } else {
      data.found = accountData.filter((item)=>nameFilter.indexOf(item.name)>=0||nameFilter.indexOf(item.accountID)>=0)
      data.missing = nameFilter.filter((filt)=>data.found.map(item=>item.name).indexOf(filt) < 0 && data.found.map(item=>item.accountID).indexOf(filt) < 0);
      data.found = data.found.filter((item)=>file.validatePath(path.join(steamDirectory,'userdata',item.accountID),true));
    }
    return data;
  }

  validateFieldGlob(input: string) {
    let vParser = new VariableParser({ left: '${', right: '}' });
    return vParser.setInput(input).isValid() ? null : APP.lang.parsers.service.validationErrors.variableString__md;
  }

  private resolveFieldGlobs(fieldPath: string[], config: UserConfiguration, settings: AppSettings, parsedConfig: ParsedUserConfiguration, vParser: VariableParser) {
    let promises: Promise<void>[] = [];
    let resolvedGlobs: string[][] = [];
    let resolvedFiles: string[][] = [];

    for (let i=0; i < parsedConfig.files.length; i++) {
      resolvedGlobs.push([]);
      resolvedFiles.push([]);
      const fieldValue: string = _.get(config,fieldPath) as string;
      if (fieldValue) {
        const variableData = this.makeVariableData(config, settings, parsedConfig.files[i]);
        const cwd = config.romDirectory;
        // this is hacky af, figure out a better way to do escaping for glob
        const parsedGlob = vParser.setInput(fieldValue).parse() ? vParser.replaceVariables((variable) => {
          return escape(this.getVariable(variable as AllVariables, variableData).replaceAll('\\','/'));
        }) : '';
        const swapString='$:$:$'
        let replacedGlob = path.resolve(cwd, parsedGlob.replaceAll('\\', swapString));
        replacedGlob = replacedGlob.replaceAll('\\','/').replaceAll(swapString,'\\');
        resolvedGlobs[i].push(replacedGlob);
        replacedGlob = replacedGlob.split(/\s/).join(" ")
        promises.push(glob(replacedGlob, { dot: true, realpath: true, cwd: cwd, follow: true }).then((files: string[]) => {
          resolvedFiles[i] = files;
        }));
      }
    }
    return Promise.all(promises).then(() => {
      return { config, parsedConfig, resolvedGlobs, resolvedFiles };
    });
  }

  execRegex(output: string) {
    let match = /^\/(.*?)\/([giu]{0,3})\|(.*?)(?:\|(.*?))?$/.exec(output);
    if (match) {
      let regex = new RegExp(match[1], match[2] || '');
      let replaceText = match[4];
      if (typeof replaceText === 'string') {
        return match[3].replace(regex, replaceText);
      }
      else {
        let innerMatch = match[3].match(regex);
        let regexOutput = '';
        if (innerMatch !== null) {
          for (let i = 1; i < innerMatch.length; i++) {
            if (innerMatch[i]) {
              regexOutput += innerMatch[i];
            }
          }
          if (regexOutput.length === 0) {
            regexOutput = innerMatch[0];
          }
        }
        return regexOutput
      }
    }

    match = /^uc\|(.*)$/i.exec(output);
    if (match) {
      return match[1].toUpperCase();
    }

    match = /^lc\|(.*)$/i.exec(output);
    if (match) {
      return match[1].toLowerCase();
    }

    match = /^rdc\|(.*)$/i.exec(output);
    if (match) {
      return match[1].replaceDiacritics();
    }

    match = /^cv:?(.*)\|(.+)$/i.exec(output);
    if (match) {
      let groups = match[1] ? _.intersection(Object.keys(this.customVariableData), match[1]) : Object.keys(this.customVariableData);
      for (let i = 0; i < groups.length; i++) {
        if (this.customVariableData[groups[i]][match[2]] !== undefined) {
          return match[2];
        }
      }
      return 'undefined'
    }

    match = /^os:(.+?)\|(.*?)(?:\|(.*?))?$/i.exec(output);
    if (match) {
      const regexPlatform = match[1].toLowerCase();
      if (regexPlatform === "win" || regexPlatform === "mac" || regexPlatform === "linux") {
        const platformMap: {[k: string]: string} = { win32: "win", linux: "linux", darwin: "mac" }
        const platform = platformMap[os.platform()];
        if (platform) {
          return ((platform === regexPlatform) ? match[2] : match[3]) || '';
        }
      }
    }
    return output
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
      case 'ACCOUNTSGLOBAL':
        output=settings.environmentVariables.userAccounts;
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
        output = this.execRegex(output)
        break;
    }
    return output || '';
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
      case 'ACCOUNTSGLOBAL':
        output=data.userAccountsGlobal;
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
        output = this.execRegex(output);
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
      userAccountsGlobal: settings.environmentVariables.userAccounts,
      romsDirectoryGlobal: settings.environmentVariables.romsDirectory,
      retroarchPath: settings.environmentVariables.retroarchPath,
      raCoresDirectory: settings.environmentVariables.raCoresDirectory,
      localImagesDirectory: settings.environmentVariables.localImagesDirectory
    }
  }
}
