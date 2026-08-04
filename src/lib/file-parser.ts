import {
  UserConfiguration,
  ParsedUserConfiguration,
  ParsedData,
  ParsedUserConfigurationFile,
  ParsedDataWithFuzzy,
  userAccountData,
  ParserVariableData,
  AllVariables,
  isVariable,
  EnvironmentVariables,
  isEnvironmentVariable,
  CustomVariables,
  UserExceptions,
  UserExceptionData,
  UserExceptionsTitles,
  AppSettings,
  ParserType,
  initArtworkRecord,
  TitleModifiers
} from "../models";
import { FuzzyService } from "../renderer/services";
import { VariableParser } from "./variable-parser";
import { APP } from "../variables";
import { parsers } from "./parsers";
import * as parserInfo from "./parsers/available-parsers";
import { artworkTypes } from "./artwork-types";
import * as url from "./helpers/url";
import * as steam from "./helpers/steam";
import * as file from "./helpers/file";
import * as paths from "../paths";
import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs-extra";
import * as os from "os";
import { glob, escape } from "glob";
import { getPath, getArgs, getStartDir } from "windows-shortcuts-ps";
import * as xdgparse from "xdg-parse";
import { SteamGridDbProvider } from "./image-providers/steamgriddb.worker";
import { TitleModifierHandler } from "./title-modifier-handler";


interface PreParserResult {
  superType: string;
  config: UserConfiguration;
  settings: AppSettings;
}

interface SteamDirectoriesResult  extends PreParserResult{
  steamDirectory: { directory: string; data: userAccountData[] }
}

interface ParserResult extends PreParserResult {
  parsedData: ParsedData;
  filteredAccounts: { found: userAccountData[]; missing: string[]; }
}

interface EmptyParsedConfigsResults extends PreParserResult{
  parsedData: ParsedData;
  parsedConfig: ParsedUserConfiguration;
  titleModifierHandler: TitleModifierHandler;
}

interface FuzzyMatchResults extends EmptyParsedConfigsResults {
  sortTitlesFromVariables: string[]
  variableFailures: boolean[]
}

interface ParsedConfigFilesResults extends PreParserResult {
  titleModifierHandler: TitleModifierHandler,
  parsedConfig: ParsedUserConfiguration
}

interface ImagesResults {
  parsedConfig: ParsedUserConfiguration,
  titleModifierHandler: TitleModifierHandler
}

export class FileParser {
  private availableParsers = parsers;
  private customVariableData: CustomVariables = {};
  private userExceptions: UserExceptionsTitles = {};

  constructor(private fuzzyService: FuzzyService) {}

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
    return this.availableParsers[key]
      ? this.availableParsers[key].getParserInfo()
      : undefined;
  }

  executeFileParser(configs: UserConfiguration[], settings: AppSettings) {
    let configPromises: Promise<ParsedUserConfiguration>[] = [];
    for (let i = 0; i < configs.length; i++) {
      let superType = parserInfo.superTypesMap[configs[i].parserType];
      configPromises.push(
        Promise.resolve({
          superType: superType,
          config: configs[i],
          settings: settings,
        })
        // pull in the data we will need to parse
        .then(this.preParserPromise.bind(this))
        .then(this.steamDirectoriesPromise.bind(this))
        .then(this.parserPromise.bind(this))

        .then(this.buildEmptyParsedConfigsPromise.bind(this))

        // in here is the title waterfall that we need to re-work
        .then(this.shortcutTitlesPromise.bind(this))
        .then(this.fuzzyMatchPromise.bind(this))
        .then(this.parsedConfigFilesPromise.bind(this))
        .then(this.shortcutsPromise.bind(this))
        .then(this.appendArgsPromise.bind(this))

        // exceptions are always last; they overwrite all other changes
        .then(this.userExceptionsPromise.bind(this))
        
        
        
        .then(this.imagesPromise.bind(this))
        .then(this.titleLockPromise.bind(this))
        .then(this.backedUpLocalImagesPromise.bind(this))
      );
    }
    return Promise.all(configPromises)
      .then((parsedConfigs: ParsedUserConfiguration[]) => {
        let maxAccounts: number = Math.max(
          ...parsedConfigs.map(
            (x: ParsedUserConfiguration) => x.foundUserAccounts.length,
          ),
        );
        return { parsedConfigs, noUserAccounts: maxAccounts === 0 };
      })
      .catch((err) => {
        throw new Error(`File Parser Execution:\n ${err}`);
      });
  }



  private preParserPromise({
    superType,
    config,
    settings,
  }: PreParserResult): Promise<PreParserResult> {
    return new Promise<PreParserResult>((resolve, reject) => {
      try {
        let preParser = new VariableParser({ left: "${", right: "}" });
        // Parse environment variables on rom directory, start in path, executable path
        config.steamDirectory = preParser
          .setInput(config.steamDirectory)
          .parse()
          ? preParser.replaceVariables((variable) => {
              return this.getEnvironmentVariable(
                variable as EnvironmentVariables,
                settings,
              ).trim();
            })
          : null;
        if (superType === parserInfo.ROMType) {
          config.romDirectory = preParser.setInput(config.romDirectory).parse()
            ? preParser.replaceVariables((variable) => {
                return this.getEnvironmentVariable(
                  variable as EnvironmentVariables,
                  settings,
                ).trim();
              })
            : null;
          config.startInDirectory = preParser
            .setInput(config.startInDirectory)
            .parse()
            ? preParser.replaceVariables((variable) => {
                return this.getEnvironmentVariable(
                  variable as EnvironmentVariables,
                  settings,
                ).trim();
              })
            : null;
          config.executable.path = preParser
            .setInput(config.executable.path)
            .parse()
            ? preParser.replaceVariables((variable) => {
                return this.getEnvironmentVariable(
                  variable as EnvironmentVariables,
                  settings,
                ).trim();
              })
            : null;
        }
        let parser = this.getParserInfo(config.parserType);
        if (parser && parser.inputs) {
          for (var inputName in parser.inputs) {
            if (
              ["dir", "path"].includes(parser.inputs[inputName].inputType) &&
              typeof config.parserInputs[inputName] === "string"
            ) {
              config.parserInputs[inputName] = preParser
                .setInput(config.parserInputs[inputName] as string)
                .parse()
                ? preParser.replaceVariables((variable) => {
                    return this.getEnvironmentVariable(
                      variable as EnvironmentVariables,
                      settings,
                    ).trim();
                  })
                : null;
            }
          }
        }
        resolve({ superType: superType, config: config, settings: settings });
      } catch (e) {
        reject(`Preparser step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private steamDirectoriesPromise({
    superType,
    config,
    settings,
  }: PreParserResult): Promise<SteamDirectoriesResult> {
    return new Promise<SteamDirectoriesResult>((resolve, reject) => {
      try {
        let steamDirectory: { directory: string; data: userAccountData[] } = {
          directory: config.steamDirectory,
          data: [],
        };
        steam
          .getAvailableLogins(steamDirectory.directory)
          .then((data) => {
            steamDirectory.data = data;
            resolve({
              superType: superType,
              config: config,
              settings: settings,
              steamDirectory: steamDirectory,
            });
          })
          .catch((error) => {
            reject(error);
          });
      } catch (e) {
        reject(
          `Get steam directories step for "${config.configTitle}":\n ${e}`,
        );
      }
    });
  }

  private parserPromise({
    superType,
    config,
    settings,
    steamDirectory,
  }: SteamDirectoriesResult): Promise<ParserResult> {
    return new Promise<ParserResult>((resolve, reject) => {
      try {
        let parser = this.getParserInfo(config.parserType);
        if (parser) {
          const useGlobal = ((x) => x.length && x[0] == "Global")(
            config.userAccounts.specifiedAccounts,
          );
          let userFilter = useGlobal
            ? settings.environmentVariables.userAccounts
            : config.userAccounts.specifiedAccounts;
          let filteredAccounts: {
            found: userAccountData[];
            missing: string[];
          } = this.filterUserAccounts(
            steamDirectory.data,
            userFilter,
            config.steamDirectory,
          );
          let directories: string[] = undefined;
          if (superType === parserInfo.ROMType) {
            directories = [config.romDirectory];
          } else if (superType === parserInfo.ManualType) {
            directories = [config.parserInputs["manualManifests"] as string];
          } else {
            directories = filteredAccounts.found.map(
              (account: userAccountData) =>
                path.join(config.steamDirectory, "userdata", account.accountID),
            );
          }
          this.availableParsers[config.parserType]
            .execute(directories, config.parserInputs)
            .then((parsedData: ParsedData) => {
              resolve({
                superType: superType,
                config: config,
                settings: settings,
                parsedData: parsedData,
                filteredAccounts: filteredAccounts,
              });
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          reject(
            this.lang.error.parserNotFound__i.interpolate({
              name: config.parserType,
            }),
          );
        }
      } catch (e) {
        reject(`Execute all parsers step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private buildEmptyParsedConfigsPromise({
    superType,
    config,
    settings,
    parsedData,
    filteredAccounts,
  }: ParserResult): Promise<EmptyParsedConfigsResults> {
    return new Promise<EmptyParsedConfigsResults>((resolve, reject) => {
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
          failed: _.cloneDeep(parsedData.failed),
          excluded: [],
        };
        resolve({
          superType: superType,
          config: config,
          settings: settings,
          parsedData: parsedData,
          parsedConfig: parsedConfig,
          titleModifierHandler: new TitleModifierHandler(parsedData)
        });
      } catch (e) {
        reject(
          `Initialize parsed configs step for "${config.configTitle}":\n ${e}`,
        );
      }
    });
  }

  // maybe we should a shortcut parser (an extension glob parser)
  // then these shortcut promises could get kicked off this stack.

  private shortcutTitlesPromise({
    superType,
    config,
    settings,
    parsedData,
    parsedConfig,
    titleModifierHandler
  }: EmptyParsedConfigsResults): Promise<EmptyParsedConfigsResults> {
    return new Promise<EmptyParsedConfigsResults>((resolve, reject) => {
      try {
        let shortcutPromises: Promise<void>[] = [];
        let usePassthrough = (superType === parserInfo.ROMType) && (config.executable.shortcutPassthrough)
        if (
          usePassthrough &&
          os.type() == "Linux"
        ) {
          for (let i = 0; i < parsedData.success.length; i++) {
            if (
              path.extname(parsedData.success[i].filePath).toLowerCase() ===
              ".desktop"
            ) {
              let shortcutPromise: Promise<void> = fs.promises
                .open(parsedData.success[i].filePath, "r")
                .then((filehandle) => {
                  return filehandle.readFile("utf8");
                })
                .then((fileData) => {
                  let entry = xdgparse.parse(fileData)["Desktop Entry"];
                  titleModifierHandler.advanceModifier(
                    i,
                    "postShortcutPassthrough",
                    entry["Name"]
                  )
                });
              shortcutPromises.push(shortcutPromise);
            }
          }
        }
        else if(
          usePassthrough &&
          os.type() == "Windows_NT"
        ) {
          // For now explicitly do nothing; Windows .lnk files do not carry metadata that could reasonably be pulled out as the title.
          for(let i=0; i < parsedData.success.length; i++) {
            titleModifierHandler.advanceModifier(
              i,
              "postShortcutPassthrough",
              titleModifierHandler.latestTitle[i]
            )
          }
        }

        Promise.all(shortcutPromises)
          .then(() => {
            resolve({
              superType: superType,
              config: config,
              settings: settings,
              parsedData: parsedData,
              parsedConfig: parsedConfig,
              titleModifierHandler: titleModifierHandler
            });
          })
          .catch((error) => {
            reject(
              `Linux shortcuts step for "${config.configTitle}":\n ${error}`,
            );
          });
      } catch (e) {
        reject(`Linux shortcuts step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private fuzzyMatchPromise({
    superType,
    config,
    settings,
    parsedData,
    parsedConfig,
    titleModifierHandler
  }: EmptyParsedConfigsResults): Promise<FuzzyMatchResults> {
    return new Promise((resolve, reject) => {
      try {
        let sortTitlesFromVariables: string[] = null;
        let variableFailures: boolean[] = Array(parsedData.success.length).fill(false);
        if (
          superType === parserInfo.ROMType ||
          superType === parserInfo.ManualType
        ) {
          const extractedTitles = parsedData.success.map(ps=>ps.extractedTitle);
          if (config.titleFromVariable.limitToGroups) {

            const titlesFromVariables = this.getTitlesFromVariables(
              config.titleFromVariable,
              extractedTitles
            )

            for(let i=0; i < parsedData.success.length; i++) {
              if(titlesFromVariables[i] !== null) {
                titleModifierHandler.advanceModifier(
                  i,
                  "postCustomVariables",
                  titlesFromVariables[i]
                )
              } 
              else if(config.titleFromVariable.skipFileIfVariableWasNotFound){
                variableFailures[i] = true;
              }
            }

          }
          if (config.sortAsFromVariable.limitToGroups) {
            sortTitlesFromVariables = this.getSortTitlesFromVariables(
              config["sortAsFromVariable"],
              extractedTitles
            )
          }
          const fuzzyTitles = this.fuzzyService.fuzzyMatcher.fuzzyMatch(
            config.fuzzyMatch,
            titleModifierHandler
          );
          for(let i = 0; i < parsedData.success.length; i++) {
            if(fuzzyTitles[i] !== null) {
              titleModifierHandler.advanceModifier(
                i,
                "postFuzzy",
                fuzzyTitles[i]
              )
            }
          }

        }
        resolve({
          superType: superType,
          config: config,
          settings: settings,
          parsedData: parsedData,
          parsedConfig: parsedConfig,
          titleModifierHandler: titleModifierHandler,
          sortTitlesFromVariables: sortTitlesFromVariables,
          variableFailures: variableFailures
        });
      } catch (e) {
        reject(`Fuzzy matching step for "${config.configTitle}":\n ${e}`);
      }
    });
  }


  private parsedConfigFilesPromise({
    superType,
    config,
    settings,
    parsedData,
    parsedConfig,
    titleModifierHandler,
    sortTitlesFromVariables,
    variableFailures
  }: FuzzyMatchResults): Promise<ParsedConfigFilesResults> {
    return new Promise((resolve, reject) => {
      try {
        let vParser = new VariableParser({ left: "${", right: "}" });
        let launcherMode = !!(
          config.parserInputs.epicLauncherMode ||
          config.parserInputs.legendaryLauncherMode ||
          config.parserInputs.gogLauncherMode ||
          config.parserInputs.amazonGamesLauncherMode ||
          config.parserInputs.uplayLauncherMode ||
          config.parserInputs.UWPLauncherMode ||
          config.parserInputs.eaLauncherMode ||
          config.parserType === "Battle.net"
        );
        for (let i = 0; i < parsedData.success.length; i++) {
          if (variableFailures[i]) {
            parsedConfig.failed.push(
              `Failing ${parsedData.success[i].filePath}\n User selected skip if variable not found and no variable matched ${parsedData.success[i].extractedTitle}`);
            continue;
          }

          let executableLocation: string = undefined;
          let startInDir: string = undefined;
          let appendArgsToExecutable: boolean = undefined;

          if (superType === parserInfo.ManualType) {
            executableLocation = parsedData.success[i].filePath;
            startInDir =
              parsedData.success[i].startInDirectory ||
              path.dirname(executableLocation);
            appendArgsToExecutable = parsedData.success[i].appendArgsToExecutable;
          } else if (superType === parserInfo.ROMType) {
            executableLocation =
              config.executable.path || parsedData.success[i].filePath;
            startInDir =
              config.startInDirectory || path.dirname(executableLocation);
            appendArgsToExecutable = config.executable.appendArgsToExecutable;
          } else if (superType === parserInfo.PlatformType) {
            if (launcherMode) {
              executableLocation = parsedData.executableLocation;
            } else {
              executableLocation = parsedData.success[i].filePath;
            }
            startInDir =
              parsedData.success[i].startInDirectory ||
              path.dirname(executableLocation);
            appendArgsToExecutable = false;
          } else if (superType === parserInfo.ArtworkOnlyType) {
            executableLocation = parsedData.success[i].extractedAppId;
            startInDir = "";
            appendArgsToExecutable = false;
          }



          let newFile: ParsedUserConfigurationFile = {
            steamCategories: undefined,
            executableLocation: executableLocation || "",
            modifiedExecutableLocation: undefined,
            startInDirectory: startInDir || "",
            argumentString: undefined,
            appendArgsToExecutable: appendArgsToExecutable,
            resolvedLocalImages: initArtworkRecord<string[]>(() => []),
            resolvedDefaultImages: initArtworkRecord<string[]>(() => []),
            defaultImage: initArtworkRecord<string>(() => null),
            backupImage: initArtworkRecord<string>(() => null),
            localImages: initArtworkRecord<string[]>(() => []),
            titles: titleModifierHandler.getTitleModifiers(i), // at this point includes up to and incl. postFuzzy
            sortAsTitle: sortTitlesFromVariables ? sortTitlesFromVariables[i] || "" : "",
            filePath: parsedData.success[i].filePath || "",
            imagePool: undefined,
            onlineImageQueries: undefined,
          };


          // In setting the modified title any of the previous titles can be used (extracted, postshortcut, postcv, postfuzzy)
          let variableData = this.makeVariableData(
            config, 
            settings, 
            newFile, 
            titleModifierHandler.getTitleModifiers(i)
          );
          
          let modifiedTitle = ""
          if (config.titleModifier) {
            modifiedTitle = vParser.setInput(config.titleModifier).parse()
            ? vParser.replaceVariables((variable) => {
                return this.getVariable(
                  variable as AllVariables,
                  variableData,
                ).trim();
              })
            : "";
          }            
          titleModifierHandler.advanceModifier(
            i,
            "postTitleModifier",
            modifiedTitle
          )
          // explicitly make postTitleModifier title available as a variable 
          // so the rest of the modifiers can use it.
          variableData.titles = titleModifierHandler.getTitleModifiers(i)

          if (superType === parserInfo.ManualType) {
            newFile.argumentString = parsedData.success[i].launchOptions || "";
          } else if (superType === parserInfo.ROMType) {
            newFile.argumentString = vParser
              .setInput(config.executableArgs)
              .parse()
              ? vParser.replaceVariables((variable) => {
                  return this.getVariable(
                    variable as AllVariables,
                    variableData,
                  ).trim();
                })
              : "";
          } else if (superType === parserInfo.PlatformType) {
            newFile.argumentString = launcherMode
              ? parsedData.success[i].launchOptions || ""
              : parsedData.success[i].fileLaunchOptions || "";
          } else if (superType === parserInfo.ArtworkOnlyType) {
            newFile.argumentString = "";
          }
          if (config.executableModifier) {
            newFile.modifiedExecutableLocation = vParser
              .setInput(config.executableModifier)
              .parse()
              ? vParser.replaceVariables((variable) => {
                  return this.getVariable(
                    variable as AllVariables,
                    variableData,
                  ).trim();
                })
              : "";
          } else {
            newFile.modifiedExecutableLocation = newFile.executableLocation
              ? `"${newFile.executableLocation}"`
              : "";
          }
          newFile.onlineImageQueries = config.onlineImageQueries
            .map((query) => {
              return vParser.setInput(query).parse()
                ? vParser.replaceVariables((variable) => {
                    return this.getVariable(
                      variable as AllVariables,
                      variableData,
                    );
                  })
                : null;
            })
            .filter((parsed) => !!parsed);
          if (config.imagePool) {
            newFile.imagePool = vParser.setInput(config.imagePool).parse()
              ? vParser.replaceVariables((variable) => {
                  return this.getVariable(
                    variable as AllVariables,
                    variableData,
                  ).trim();
                })
              : "";
          } else {
            newFile.imagePool = titleModifierHandler.latestTitle[i];
          }

          // Use the Steam Category field as-is (trimmed, with blanks removed).
          // If no categories are set, leave it empty so no Steam collection is
          // created for these games (see issue #819) — do NOT fall back to the
          // parser's config title.
          newFile.steamCategories = config.steamCategories
            .map((cat) => cat.trim())
            .filter((cat) => cat.length > 0);

          parsedConfig.files.push(newFile);
        }
        resolve({
          superType: superType,
          config: config,
          settings: settings,
          parsedConfig: parsedConfig,
          titleModifierHandler: titleModifierHandler,
        });
      } catch (e) {
        reject(`Add parsed files step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private shortcutsPromise({
    superType,
    config,
    settings,
    parsedConfig,
    titleModifierHandler,
  }: ParsedConfigFilesResults): Promise<ParsedConfigFilesResults> {
    return new Promise((resolve, reject) => {
      try {
        let shortcutPromises: Promise<void>[] = [];
        if (
          superType === parserInfo.ROMType &&
          parsedConfig.shortcutPassthrough &&
          os.type() == "Windows_NT"
        ) {
          let indices: number[] = [];
          let shortcutPaths: string[] = [];
          for (let i = 0; i < parsedConfig.files.length; i++) {
            if (
              path.extname(parsedConfig.files[i].filePath).toLowerCase() ===
              ".lnk"
            ) {
              indices.push(i);
              shortcutPaths.push(parsedConfig.files[i].filePath);
            }
          }
          shortcutPromises.push(
            getPath(shortcutPaths)
              .then((actuals: string[]) => {
                return getStartDir(shortcutPaths).then((starts: string[]) => {
                  return { actuals: actuals, starts: starts };
                });
              })
              .then(
                ({
                  actuals,
                  starts,
                }: {
                  actuals: string[];
                  starts: string[];
                }) => {
                  return getArgs(shortcutPaths).then((args: string[]) => {
                    return { actuals: actuals, starts: starts, args: args };
                  });
                },
              )
              .then(
                ({
                  actuals,
                  starts,
                  args,
                }: {
                  actuals: string[];
                  starts: string[];
                  args: string[];
                }) => {
                  for (let i = 0; i < indices.length; i++) {
                    let index = indices[i];
                    parsedConfig.files[index].modifiedExecutableLocation =
                      `"${actuals[i]}"`;
                    parsedConfig.files[index].startInDirectory =
                      starts[i] || path.dirname(actuals[i]);
                    parsedConfig.files[index].argumentString = args[i] || "";
                  }
                },
              ),
          );
        }
        if (
          superType === parserInfo.ROMType &&
          parsedConfig.shortcutPassthrough &&
          os.type() == "Linux"
        ) {
          for (let j = 0; j < parsedConfig.files.length; j++) {
            if (
              path.extname(parsedConfig.files[j].filePath).toLowerCase() ===
              ".desktop"
            ) {
              let shortcutPromise: Promise<void> = fs.promises
                .open(parsedConfig.files[j].filePath, "r")
                .then((filehandle) => {
                  return filehandle.readFile("utf8");
                })
                .then((data) => {
                  let entry = xdgparse.parse(data)["Desktop Entry"];
                  let splitExec = String(entry["Exec"]).match(
                    /(?:(?:\S*\\\s)+|(?:[^\s"]+|"[^"]*"))+/g,
                  );
                  let modifiedExecutableLocation = splitExec.shift();
                  parsedConfig.files[j].modifiedExecutableLocation =
                    modifiedExecutableLocation;
                  parsedConfig.files[j].startInDirectory =
                    (entry["Path"] && String(entry["Path"])) ||
                    path.dirname(modifiedExecutableLocation);
                  parsedConfig.files[j].argumentString = splitExec.join(" ");
                });
              shortcutPromises.push(shortcutPromise);
            }
          }
        }
        Promise.all(shortcutPromises)
          .then(() => {
            resolve({
              superType: superType,
              config: config,
              settings: settings,
              parsedConfig: parsedConfig,
              titleModifierHandler: titleModifierHandler
            });
          })
          .catch((error) => {
            reject(
              `Shortcut passthrough step for "${config.configTitle}":\n ${error}`,
            );
          });
      } catch (e) {
        reject(`Shortcut passthrough step for "${config.configTitle}":\n ${e}`);
      }
    });
  }

  private appendArgsPromise({
    superType,
    config,
    settings,
    parsedConfig,
    titleModifierHandler
  }: ParsedConfigFilesResults): Promise<ParsedConfigFilesResults> {
    return new Promise((resolve, reject) => {
      try {
        for (let j = 0; j < parsedConfig.files.length; j++) {
          if (parsedConfig.files[j].appendArgsToExecutable) {
            parsedConfig.files[j].modifiedExecutableLocation =
              `${parsedConfig.files[j].modifiedExecutableLocation} ${parsedConfig.files[j].argumentString}`;
            parsedConfig.files[j].argumentString = "";
          }
          parsedConfig.files[j].modifiedExecutableLocation =
            parsedConfig.files[j].modifiedExecutableLocation.trim();
        }
        resolve({
          superType: superType,
          config: config,
          settings: settings,
          parsedConfig: parsedConfig,
          titleModifierHandler
        });
      } catch (e) {
        reject(
          `Append args to executable step for ${config.configTitle}:\n ${e}`,
        );
      }
    });
  }

  private userExceptionsPromise({
    superType,
    config,
    settings,
    parsedConfig,
    titleModifierHandler
  }: ParsedConfigFilesResults): Promise<ParsedConfigFilesResults> {
    return new Promise((resolve, reject) => {
      try {
        const appIdRegex: RegExp = /\$\{id\:([0-9]*?)\}/;
        for (let i = 0; i < parsedConfig.files.length; i++) {
          // This little bit of magic means that we can also match on Exception ID
          let shortAppId: string;
          if (superType === parserInfo.ArtworkOnlyType) {
            shortAppId = parsedConfig.files[i].modifiedExecutableLocation.replace(/\"/g, "");
          } else {
            shortAppId = steam.generateShortAppId(
              parsedConfig.files[i].modifiedExecutableLocation,
              parsedConfig.files[i].titles.extracted,
            );
          }
          const exceptionMatches = Object.entries(this.userExceptions)
            .filter(
              ([extractedTitle, exception]: [
                extractedTitle: string,
                exception: UserExceptionData,
              ]) => {
                if (appIdRegex.test(extractedTitle)) {
                  return extractedTitle.match(appIdRegex)[1] == shortAppId;
                } else {
                  return extractedTitle == parsedConfig.files[i].titles.extracted;
                }
              },
            )
            .map((x) => {
              return { exceptionKey: x[0], ...x[1] };
            });

          if (exceptionMatches.length) {
            const exceptions = exceptionMatches[0];
            if (exceptions && exceptions.exclude) {
              parsedConfig.excluded.push({
                exceptionKey: exceptions.exceptionKey,
                filePath: parsedConfig.files[i].filePath,
              });
              parsedConfig.files[i] = null;
              continue;
            }
            if (exceptions && exceptions.newTitle) {
              titleModifierHandler.advanceModifier(
                i,
                "final",
                exceptions.newTitle
              )
            }
            if (exceptions && exceptions.commandLineArguments) {
              parsedConfig.files[i].argumentString =
                exceptions.commandLineArguments;
            }
            if (
              exceptions &&
              !exceptions.excludeArtwork &&
              exceptions.searchTitle
            ) {
              parsedConfig.files[i].onlineImageQueries = [
                exceptions.searchTitle,
              ];
              parsedConfig.files[i].imagePool = exceptions.searchTitle;
            }
            if (exceptions && exceptions.excludeArtwork) {
              parsedConfig.files[i].onlineImageQueries = [];
            }
          }
        }
        parsedConfig.files = parsedConfig.files.filter((x) => !!x);
        resolve({
          superType: superType,
          config: config,
          settings: settings,
          parsedConfig: parsedConfig,
          titleModifierHandler: titleModifierHandler
        });
      } catch (e) {
        reject(`Apply user exceptions step for ${config.configTitle}:\n ${e}`);
      }
    });
  }

  private imagesPromise({
    superType,
    config,
    settings,
    parsedConfig,
    titleModifierHandler
  }: ParsedConfigFilesResults): Promise<ImagesResults> {
    return new Promise((resolve, reject) => {
      try {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        let defaultPromises: Promise<void>[] = [];
        let localPromises: Promise<void>[] = [];
        let vParser = new VariableParser({ left: "${", right: "}" });
        for (const artworkType of artworkTypes) {
          defaultPromises.push(
            this.resolveFieldGlobs(
              ["defaultImage", artworkType],
              config,
              settings,
              parsedConfig,
              vParser,
              titleModifierHandler
            ).then((fieldData) => {
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j].resolvedDefaultImages[artworkType] =
                  fieldData.resolvedGlobs[j];
                for (let k = 0; k < fieldData.resolvedFiles[j].length; k++) {
                  const item = fieldData.resolvedFiles[j][k];
                  if (extRegex.test(path.extname(item))) {
                    parsedConfig.files[j].defaultImage[artworkType] =
                      url.encodeFile(item);
                    break;
                  }
                }
              }
            }),
          );
          localPromises.push(
            this.resolveFieldGlobs(
              ["localImages", artworkType],
              config,
              settings,
              parsedConfig,
              vParser,
              titleModifierHandler
            ).then((fieldData) => {
              for (let j = 0; j < fieldData.parsedConfig.files.length; j++) {
                parsedConfig.files[j].resolvedLocalImages[artworkType] =
                  fieldData.resolvedGlobs[j];
                parsedConfig.files[j].localImages[artworkType] =
                  fieldData.resolvedFiles[j]
                    .filter((item) => {
                      return extRegex.test(path.extname(item));
                    })
                    .map((item) => {
                      return url.encodeFile(item);
                    });
              }
            }),
          );
        }
        Promise.all(localPromises)
          .then(() => Promise.all(defaultPromises))
          .then(() => {
            resolve({
              parsedConfig,
              titleModifierHandler
          });
          });
      } catch (e) {
        reject(`Resolve images step for "${parsedConfig.configurationTitle}":\n ${e}`);
      }
    });
  }

  private titleLockPromise({
    parsedConfig,
    titleModifierHandler
  }: ImagesResults): Promise<ParsedUserConfiguration> {
    return new Promise((resolve, reject) => {
      try {
        for(let i = 0; i < parsedConfig.files.length; i++) {
          parsedConfig.files[i].titles = titleModifierHandler.getTitleModifiers(i)
          titleModifierHandler.lockModifier(i);
        }
        resolve(parsedConfig)
      } catch (e){
        reject(`Title lock failed for "${parsedConfig.configurationTitle}":\n ${e}`)
      }
    })
  }

  private backedUpLocalImagesPromise(parsedConfig: ParsedUserConfiguration): Promise<ParsedUserConfiguration> {
    return new Promise((resolve, reject) => {
      try {
        let backedupPromises: Promise<void>[] = [];
        if (parsedConfig.drmProtect) {
          for (let j = 0; j < parsedConfig.files.length; j++) {
            for (const artworkType of artworkTypes) {
              if (parsedConfig.files[j].onlineImageQueries.length) {
                backedupPromises.push(
                  SteamGridDbProvider.retrieveIdsFromTitle(
                    parsedConfig.files[j].onlineImageQueries[0],
                  ).then((possibleGameIds: number[]) => {
                    if (possibleGameIds.length) {
                      const backupDir = path.join(
                        paths.userDataDir,
                        "artworkBackups",
                        artworkType,
                      );
                      return glob(`${possibleGameIds[0]}.*`, {
                        dot: true,
                        cwd: backupDir,
                        absolute: true,
                      }).then((localBackups: string[]) => {
                        parsedConfig.files[j].backupImage[artworkType] =
                          localBackups.length
                            ? url.encodeFile(localBackups[0])
                            : undefined;
                      });
                    }
                  }),
                );
              }
            }
          }
        }
        Promise.all(backedupPromises).then(() => {
          resolve(parsedConfig);
        });
      } catch (e) {
        reject(
          `Backed up images step for "${parsedConfig.configurationTitle}":\n ${e}`,
        );
      }
    });
  }

  private _groupsHelper(
    variableConfig: UserConfiguration["titleFromVariable" | "sortAsFromVariable"],
  ) {
    return _.intersectionWith(
        variableConfig.limitToGroups,
        Object.keys(this.customVariableData),
      ) || [];
  }

  private getTitlesFromVariables(
    variableConfig: UserConfiguration["titleFromVariable"],
    extractedTitles: string[]
  ) {
    const titles = Array(extractedTitles.length).fill(null);
    const groups = this._groupsHelper(variableConfig)
    const useCaseInsensitive = variableConfig.caseInsensitiveVariables

    for (let i = 0; i < extractedTitles.length; i++) {
      const currentTitle = extractedTitles[i]
      let match = null;
      for (let j = 0; j < groups.length; j++) {
        const groupData = this.customVariableData[groups[j]];
        
        // Compute the matching key
        if (useCaseInsensitive) {
          for (const key in groupData) {
            if (currentTitle.toLowerCase() === key.toLowerCase()) {
              match = key
              break;
            }
          }
        } else if (groupData[currentTitle] !== undefined){
          match = currentTitle
        }

        if(match) {
          let titleMappingValue = groupData[match]
          if (typeof titleMappingValue === "string") {
            titles[i] = titleMappingValue
            break;
          }
          else if (typeof titleMappingValue === "object" && "DisplayTitle" in titleMappingValue) {
            titles[i] = titleMappingValue["DisplayTitle"]
            break;
          }
        }
      }
    }
    return titles;
  }

  private getSortTitlesFromVariables (
    variableConfig: UserConfiguration["sortAsFromVariable"],
    latestTitle: string[]
  ): string[] {
    const sortAsTitles = Array(latestTitle.length).fill(null);
    const groups = this._groupsHelper(variableConfig)
    for (let i = 0; i < latestTitle.length; i++) {
      for (let j = 0; j < groups.length; j++) {
        const groupData = this.customVariableData[groups[j]];
        // Compute the matching key
        if (groupData[latestTitle[i]]){
          let titleMappingValue = groupData[latestTitle[i]]
          if (typeof titleMappingValue === "object" && "SortAsTitle" in titleMappingValue) {
            sortAsTitles[i] = titleMappingValue["SortAsTitle"]
            break;
          }
        }
      }
    }
    return sortAsTitles
  }    

  private filterUserAccounts(
    accountData: userAccountData[],
    nameFilter: string[],
    steamDirectory: string,
  ) {
    let data: { found: userAccountData[]; missing: string[] } = {
      found: [],
      missing: [],
    };
    if (nameFilter.length === 0) {
      data.found = _.cloneDeep(accountData);
    } else {
      data.found = accountData.filter(
        (item) =>
          nameFilter.indexOf(item.name) >= 0 ||
          nameFilter.indexOf(item.accountID) >= 0,
      );
      data.missing = nameFilter.filter(
        (filt) =>
          data.found.map((item) => item.name).indexOf(filt) < 0 &&
          data.found.map((item) => item.accountID).indexOf(filt) < 0,
      );
      data.found = data.found.filter((item) =>
        file.validatePath(
          path.join(steamDirectory, "userdata", item.accountID),
          true,
        ),
      );
    }
    return data;
  }

  validateFieldGlob(input: string) {
    let vParser = new VariableParser({ left: "${", right: "}" });
    return vParser.setInput(input).isValid()
      ? null
      : APP.lang.parsers.service.validationErrors.variableString__md;
  }

  private resolveFieldGlobs(
    fieldPath: string[],
    config: UserConfiguration,
    settings: AppSettings,
    parsedConfig: ParsedUserConfiguration,
    vParser: VariableParser,
    titleModifierHandler: TitleModifierHandler
  ) {
    let promises: Promise<void>[] = [];
    let resolvedGlobs: string[][] = [];
    let resolvedFiles: string[][] = [];

    for (let i = 0; i < parsedConfig.files.length; i++) {
      resolvedGlobs.push([]);
      resolvedFiles.push([]);
      const fieldValue: string = _.get(config, fieldPath) as string;
      if (fieldValue) {
        const variableData = this.makeVariableData(
          config,
          settings,
          parsedConfig.files[i],
          titleModifierHandler.getTitleModifiers(i)
        );
        const cwd = config.romDirectory;
        // this is hacky af, figure out a better way to do escaping for glob
        const parsedGlob = vParser.setInput(fieldValue).parse()
          ? vParser.replaceVariables((variable) => {
              return escape(
                this.getVariable(
                  variable as AllVariables,
                  variableData,
                ).replaceAll("\\", "/"),
              );
            })
          : "";
        const swapString = "$:$:$";
        let replacedGlob = path.resolve(
          cwd,
          parsedGlob.replaceAll("\\", swapString),
        );
        replacedGlob = replacedGlob
          .replaceAll("\\", "/")
          .replaceAll(swapString, "\\");
        resolvedGlobs[i].push(replacedGlob);
        replacedGlob = replacedGlob.split(/\s/).join(" ");
        promises.push(
          glob(replacedGlob, {
            dot: true,
            realpath: true,
            cwd: cwd,
            follow: true,
          }).then((files: string[]) => {
            resolvedFiles[i] = files;
          }),
        );
      }
    }
    return Promise.all(promises).then(() => {
      return { config, parsedConfig, resolvedGlobs, resolvedFiles };
    });
  }

  execRegex(output: string) {
    let match = /^\/(.*?)\/([giu]{0,3})\|(.*?)(?:\|(.*?))?$/.exec(output);
    if (match) {
      let regex = new RegExp(match[1], match[2] || "");
      let replaceText = match[4];
      if (typeof replaceText === "string") {
        return match[3].replace(regex, replaceText);
      } else {
        let innerMatch = match[3].match(regex);
        let regexOutput = "";
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
        return regexOutput;
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
      let groups = match[1]
        ? _.intersection(Object.keys(this.customVariableData), match[1])
        : Object.keys(this.customVariableData);
      for (let i = 0; i < groups.length; i++) {
        if (this.customVariableData[groups[i]][match[2]] !== undefined) {
          return match[2];
        }
      }
      return "undefined";
    }

    match = /^os:(.+?)\|(.*?)(?:\|(.*?))?$/i.exec(output);
    if (match) {
      const regexPlatform = match[1].toLowerCase();
      if (
        regexPlatform === "win" ||
        regexPlatform === "mac" ||
        regexPlatform === "linux"
      ) {
        const platformMap: { [k: string]: string } = {
          win32: "win",
          linux: "linux",
          darwin: "mac",
        };
        const platform = platformMap[os.platform()];
        if (platform) {
          return (platform === regexPlatform ? match[2] : match[3]) || "";
        }
      }
    }
    return output;
  }

  getEnvironmentVariable(
    variable: EnvironmentVariables,
    settings: AppSettings,
  ) {
    let output = variable as string;
    switch (<EnvironmentVariables>variable.toUpperCase()) {
      case "/":
        output = path.sep;
        break;
      case "SRMDIR":
        output = APP.srmdir;
        break;
      case "STEAMDIRGLOBAL":
        output = settings.environmentVariables.steamDirectory;
        break;
      case "ROMSDIRGLOBAL":
        output = settings.environmentVariables.romsDirectory;
        break;
      case "RETROARCHPATH":
        output = settings.environmentVariables.retroarchPath;
        break;
      case "RACORES":
        output = settings.environmentVariables.raCoresDirectory;
        break;
      case "LOCALIMAGESDIR":
        output = settings.environmentVariables.localImagesDirectory;
        break;
      default:
        output = this.execRegex(output);
        break;
    }
    return output || "";
  }

  private getVariable(variable: AllVariables, variableData: ParserVariableData) {
    const unavailable = "undefined";
    let output = variable as string;
    switch (<AllVariables>variable.toUpperCase()) {
      case "/":
        output = path.sep;
        break;
      case "SRMDIR":
        output = APP.srmdir;
        break;
      case "EXEDIR":
        output =
          variableData.executableLocation != undefined
            ? path.dirname(variableData.executableLocation)
            : unavailable;
        break;
      case "EXEEXT":
        output =
          variableData.executableLocation != undefined
            ? path.extname(variableData.executableLocation)
            : unavailable;
        break;
      case "EXENAME":
        output =
          variableData.executableLocation != undefined
            ? path.basename(
                variableData.executableLocation,
                path.extname(variableData.executableLocation),
              )
            : unavailable;
        break;
      case "EXEPATH":
        output =
          variableData.executableLocation != undefined
            ? variableData.executableLocation
            : unavailable;
        break;
      case "FILEDIR":
        output =
          variableData.filePath != undefined
            ? path.dirname(variableData.filePath)
            : unavailable;
        break;
      case "FILEEXT":
        output =
          variableData.filePath != undefined
            ? path.extname(variableData.filePath)
            : unavailable;
        break;
      case "FILENAME":
        output =
          variableData.filePath != undefined
            ? path.basename(variableData.filePath, path.extname(variableData.filePath))
            : unavailable;
        break;
      case "FILEPATH":
        output = variableData.filePath != undefined ? variableData.filePath : unavailable;
        break;
      case "TITLE":
        output = variableData.titles["extracted"];
        break;
      case "SHORTCUTTITLE":
        output = variableData.titles["postShortcutPassthrough"];
        break;
      case "CUSTOMVARIABLETITLE":
        output = variableData.titles["postCustomVariables"]
      case "FUZZYTITLE":
        output = variableData.titles["postFuzzy"] || variableData.titles["extracted"];
        break;
      case "FINALTITLE":
        output = variableData.titles["postTitleModifier"];
        break;
      case "PARSERTITLE":
        output = variableData.configTitle != undefined ? variableData.configTitle : unavailable;
        break;
      case "ROMDIR":
        output =
          variableData.romDirectory != undefined ? variableData.romDirectory : unavailable;
        break;
      case "STARTINDIR":
        output =
          variableData.startInDirectory != undefined
            ? variableData.startInDirectory
            : unavailable;
        break;
      case "STEAMDIR":
        output =
          variableData.steamDirectory != undefined ? variableData.steamDirectory : unavailable;
        break;

      case "STEAMDIRGLOBAL":
        output = variableData.steamDirectoryGlobal;
        break;
      case "ROMSDIRGLOBAL":
        output = variableData.romsDirectoryGlobal;
        break;
      case "RETROARCHPATH":
        output = variableData.retroarchPath;
        break;
      case "RACORES":
        output = variableData.raCoresDirectory;
        break;
      case "LOCALIMAGESDIR":
        output = variableData.localImagesDirectory;
        break;
      default:
        output = this.execRegex(output);
        break;
    }
    return output || "";
  }

  private makeVariableData(
    config: UserConfiguration,
    settings: AppSettings,
    file: ParsedUserConfigurationFile,
    titles: TitleModifiers,
  ): ParserVariableData {
    return <ParserVariableData>{
      configTitle: config.configTitle,
      executableLocation: file.executableLocation,
      startInDirectory: file.startInDirectory,
      steamDirectory: config.steamDirectory,
      filePath: file.filePath,
      titles: titles,
      romDirectory: config.romDirectory,
      steamDirectoryGlobal: settings.environmentVariables.steamDirectory,
      romsDirectoryGlobal: settings.environmentVariables.romsDirectory,
      retroarchPath: settings.environmentVariables.retroarchPath,
      raCoresDirectory: settings.environmentVariables.raCoresDirectory,
      localImagesDirectory: settings.environmentVariables.localImagesDirectory,
    };
  }
}
