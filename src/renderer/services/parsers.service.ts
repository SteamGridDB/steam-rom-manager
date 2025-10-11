import { CustomVariablesService } from "./custom-variables.service";
import { UserExceptionsService } from "./user-exceptions.service";
import { Injectable } from "@angular/core";
import {
  UserConfiguration,
  UserAccountsInfo,
  AppSettings,
  EnvironmentVariables,
  ControllerTemplates,
  ParserType,
} from "../../models";
import { LoggerService } from "./logger.service";
import { FuzzyService } from "./fuzzy.service";
import { SettingsService } from "./settings.service";
import { FileParser, VariableParser, ControllerManager } from "../../lib";
import { BehaviorSubject, Subject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import { artworkTypes } from "../../lib/artwork-types";
import { APP } from "../../variables";
import * as json from "../../lib/helpers/json";
import * as file from "../../lib/helpers/file";
import * as parserInfo from "../../lib/parsers/available-parsers";
import * as unique_ids from "../../lib/helpers/unique-ids";
import * as steam from "../../lib/helpers/steam";
import * as paths from "../../paths";
import * as path from "path";
import * as schemas from "../schemas";
import * as modifiers from "../modifiers";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as os from "os";

@Injectable()
export class ParsersService {
  private appSettings: AppSettings;
  private fileParser: FileParser;
  private savedControllerTemplates: Subject<ControllerTemplates>;
  private controllerTemps: ControllerTemplates = {};
  private userConfigurations: BehaviorSubject<
    { saved: UserConfiguration; current: UserConfiguration }[]
  >;
  private deletedConfigurations: BehaviorSubject<
    { saved: UserConfiguration; current: UserConfiguration }[]
  >;
  private validator: json.Validator = new json.Validator(
    schemas.userConfiguration,
    modifiers.userConfiguration,
  );
  private defaultValidator: json.Validator = new json.Validator(
    schemas.defaultUserConfiguration,
    modifiers.userConfiguration,
  );
  private savingIsDisabled: boolean = false;
  private configurationsLoadedSubject: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  constructor(
    private fuzzyService: FuzzyService,
    private loggerService: LoggerService,
    private cVariableService: CustomVariablesService,
    private exceptionsService: UserExceptionsService,
    private settingsService: SettingsService,
  ) {
    this.fileParser = new FileParser(this.fuzzyService);
    this.userConfigurations = new BehaviorSubject<
      { saved: UserConfiguration; current: UserConfiguration }[]
    >([]);
    this.savedControllerTemplates = new Subject<ControllerTemplates>();
    this.deletedConfigurations = new BehaviorSubject<
      { saved: UserConfiguration; current: UserConfiguration }[]
    >([]);
    this.readUserConfigurations();
    this.readSavedControllerTemplates();
    this.cVariableService.dataObservable.subscribe((variables) => {
      this.fileParser.setCustomVariables(variables);
    });
    this.exceptionsService.dataObservable.subscribe((data) => {
      this.fileParser.setUserExceptions(data.saved || { titles: {} });
    });
    this.settingsService.onLoad((appSettings: AppSettings) => {
      this.appSettings = appSettings;
    });
  }

  get lang() {
    return APP.lang.parsers.service;
  }
  get controllerTemplates() {
    return this.controllerTemps;
  }

  set controllerTemplates(controllerTemplates: ControllerTemplates) {
    this.controllerTemps = controllerTemplates;
  }

  onLoad(callback: (userConfigurations: UserConfiguration[]) => void) {
    this.configurationsLoadedSubject
      .asObservable()
      .pipe(
        takeWhile((loaded) => {
          if (loaded) {
            callback(
              this.userConfigurations
                .getValue()
                .map((item) => _.cloneDeep(item.saved)),
            );
          }
          return !loaded;
        }),
      )
      .subscribe();
  }

  getUserConfigurations() {
    return this.userConfigurations.asObservable();
  }

  getUserConfigurationsArray() {
    return this.userConfigurations.getValue();
  }

  getSavedControllerTemplates() {
    return this.savedControllerTemplates.asObservable();
  }

  async getControllerTemplates(
    steamDir: string,
    controllerType: string,
  ): Promise<any[]> {
    try {
      return await ControllerManager.readTemplates(steamDir, controllerType);
    } catch (error) {
      this.loggerService.error(this.lang.error.fetchingTemplates, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.loggerService.error(error);
    }
  }

  removeControllers(steamDir: string, userId: string, parserId?: string) {
    const controllerManager: ControllerManager = new ControllerManager();
    controllerManager.removeAllControllersAndWrite(steamDir, userId, parserId);
    controllerManager.removeAllControllersEnabledAndWrite(
      steamDir,
      userId,
      parserId,
    );
  }

  parseSteamDir(steamDirInput: string) {
    let preParser = new VariableParser({ left: "${", right: "}" });
    return preParser.setInput(steamDirInput).parse()
      ? preParser.replaceVariables((variable) => {
          return this.fileParser
            .getEnvironmentVariable(
              variable as EnvironmentVariables,
              this.appSettings,
            )
            .trim();
        })
      : "";
  }

  parseUserAccounts(accountsInfo: UserAccountsInfo, steamDir: string) {
    return new Promise<string[]>((resolve, reject) => {
      const useGlobal = ((x) => x.length && x[0] == "Global")(
        accountsInfo.specifiedAccounts,
      );
      let accountList = useGlobal
        ? this.appSettings.environmentVariables.userAccounts
        : accountsInfo.specifiedAccounts;
      steam
        .getAvailableLogins(steamDir)
        .then((data) => {
          data = data.filter((x) =>
            fs.existsSync(path.join(steamDir, "userdata", x.accountID)),
          );
          if (accountList.length) {
            resolve(
              data
                .filter((x) => accountList.indexOf(x.name) > -1)
                .map((x) => x.accountID),
            );
          } else {
            resolve(data.map((x) => x.accountID));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getKnownSteamDirectories() {
    let steamdirs = this.getUserConfigurationsArray()
      .map((config) => this.parseSteamDir(config.saved.steamDirectory))
      .filter((path) => path !== "");
    if (this.appSettings.environmentVariables.steamDirectory) {
      steamdirs.push(this.appSettings.environmentVariables.steamDirectory);
    }
    return _.uniq(steamdirs);
  }

  getDeletedConfigurations() {
    return this.deletedConfigurations.asObservable();
  }

  getDefaultValues() {
    return this.defaultValidator.getDefaultValues() as UserConfiguration;
  }

  saveConfiguration(config: {
    saved: UserConfiguration;
    current: UserConfiguration;
  }) {
    let userConfigurations = this.userConfigurations.getValue();
    let copy: { saved: UserConfiguration; current: UserConfiguration } =
      _.cloneDeep(config);
    copy.saved.parserId = unique_ids.newParserId();
    copy.saved.disabled = false;
    userConfigurations = userConfigurations.concat(copy);
    this.userConfigurations.next(userConfigurations);
    this.saveUserConfigurations();
  }

  swapIndex(fromIndex: number, toIndex: number) {
    if (fromIndex == toIndex) {
      return;
    }
    const configs = this.userConfigurations.getValue();
    if (fromIndex >= configs.length || toIndex >= configs.length) {
      throw "Index out of bounds";
    }
    const from = configs[fromIndex];
    configs[fromIndex] = configs[toIndex];
    configs[toIndex] = from;
    this.userConfigurations.next(configs);
    this.saveUserConfigurations();
  }

  injectIndex(fromIndex: number, toIndex: number) {
    if (fromIndex == toIndex) {
      return;
    }
    const configs = this.userConfigurations.getValue();
    if (fromIndex >= configs.length || toIndex >= configs.length) {
      throw "Index out of bounds";
    }
    const from = configs[fromIndex];
    const withoutFrom = configs.filter((_, i) => i !== fromIndex);
    const newConfigs = withoutFrom
      .slice(0, toIndex)
      .concat(from)
      .concat(withoutFrom.slice(toIndex));
    this.userConfigurations.next(newConfigs);
    this.saveUserConfigurations();
  }

  changeEnabledStatus(parserId: string, enabled: boolean): Promise<void> {
    let userConfigurations = this.userConfigurations.getValue();
    let updateIndex = userConfigurations
      .map((e) => e.saved.parserId)
      .indexOf(parserId);
    if (updateIndex != -1) {
      userConfigurations[updateIndex].saved.disabled = !enabled;
      this.userConfigurations.next(userConfigurations);
      return this.saveUserConfigurations();
    } else {
      throw `Could not ${enabled ? "enable" : "disable"} ${parserId}. No such parser exists.`;
    }
  }

  changeEnabledStatusAll(enabled: boolean): Promise<void> {
    let userConfigurations = this.userConfigurations.getValue();
    for (let i = 0; i < userConfigurations.length; i++) {
      userConfigurations[i].saved.disabled = !enabled;
    }
    this.userConfigurations.next(userConfigurations);
    return this.saveUserConfigurations();
  }

  updateConfiguration(index: number, config?: UserConfiguration) {
    let userConfigurations = this.userConfigurations.getValue();

    if (config === undefined) {
      if (userConfigurations[index].current == null) return;
      else
        userConfigurations[index].current.parserId =
          userConfigurations[index].saved.parserId;
      if (
        parserInfo.superTypesMap[
          userConfigurations[index].current.parserType
        ] === parserInfo.ArtworkOnlyType
      ) {
        userConfigurations[index].current.titleFromVariable.limitToGroups = [];
      }
      userConfigurations[index] = {
        saved: userConfigurations[index].current,
        current: null,
      };
    } else {
      config.parserId = userConfigurations[index].saved.parserId;
      userConfigurations[index] = { saved: config, current: null };
    }

    this.userConfigurations.next(userConfigurations);
    this.saveUserConfigurations();
  }

  setCurrentConfiguration(index: number, config: UserConfiguration) {
    let userConfigurations = this.userConfigurations.getValue();
    userConfigurations[index].current = config;
    this.userConfigurations.next(userConfigurations);
  }

  deleteConfiguration(index: number) {
    let userConfigurations = this.userConfigurations.getValue();

    if (userConfigurations.length > index && index >= 0) {
      let deletedConfigurations = this.deletedConfigurations.getValue();

      deletedConfigurations = deletedConfigurations.concat(
        userConfigurations.splice(index, 1),
      );

      this.deletedConfigurations.next(deletedConfigurations);
      this.userConfigurations.next(userConfigurations);
      this.saveUserConfigurations();
    }
  }

  restoreConfiguration(index?: number) {
    let deletedConfigurations = this.deletedConfigurations.getValue();
    if (index == undefined) index = 0;

    if (deletedConfigurations.length > index && index >= 0) {
      let userConfigurations = this.userConfigurations.getValue();

      userConfigurations = userConfigurations.concat(
        deletedConfigurations.splice(index, 1),
      );

      this.deletedConfigurations.next(deletedConfigurations);
      this.userConfigurations.next(userConfigurations);
      this.saveUserConfigurations();
    }
  }

  getParserInfo(parserType: ParserType) {
    return this.fileParser.getParserInfo(parserType);
  }

  executeFileParser(...configs: UserConfiguration[]) {
    let invalidConfigTitles: string[] = [];
    let skipped: string[] = [];
    let validConfigs: UserConfiguration[] = [];
    if (configs.length === 0) {
      let configArray = this.getUserConfigurationsArray();
      for (let i = 0; i < configArray.length; i++) {
        if (configArray[i].saved.disabled)
          skipped.push(configArray[i].saved.configTitle);
        else configs.push(configArray[i].saved);
      }
    }

    configs = _.cloneDeep(configs);

    for (let i = 0; i < configs.length; i++) {
      if (this.isConfigurationValid(configs[i])) validConfigs.push(configs[i]);
      else
        invalidConfigTitles.push(
          configs[i].configTitle || this.lang.text.noTitle,
        );
    }
    return this.fileParser
      .executeFileParser(validConfigs, this.appSettings)
      .then((parsedData) => {
        return {
          parsedData: parsedData,
          invalid: invalidConfigTitles,
          skipped: skipped,
        };
      });
  }

  validate(key: string, data: any, options?: any) {
    switch (key) {
      case "parserType":
        return parserInfo.availableParsers.includes(data)
          ? null
          : this.lang.validationErrors.parserType__md;
      case "configTitle":
        return data ? null : this.lang.validationErrors.configTitle__md;
      case "parserId":
        return data ? null : this.lang.validationErrors.parserId__md;
      case "steamCategories":
        return null;
      case "executable":
        const isDir = os.type() == "Darwin" ? undefined : false;
        return !(data || {}).path ||
          this.validateEnvironmentPath(data.path, isDir)
          ? null
          : this.lang.validationErrors.executable__md;
      case "romDirectory":
        return this.validateEnvironmentPath(data || "", true)
          ? null
          : this.lang.validationErrors.romDir__md;
      case "steamDirectory":
        return this.validateEnvironmentPath(data || "", true)
          ? null
          : this.lang.validationErrors.steamDir__md;
      case "startInDirectory":
        return data == null ||
          data.length === 0 ||
          this.validateEnvironmentPath(data || "", true)
          ? null
          : this.lang.validationErrors.startInDir__md;
      case "userAccounts":
        return data.specifiedAccounts && data.specifiedAccounts.length
          ? null
          : this.lang.validationErrors.userAccounts__md;
      case "parserInputs": {
        let availableParser = this.getParserInfo(data["parser"]);
        if (availableParser) {
          if (availableParser.inputs === undefined) {
            return this.lang.validationErrors.parserInput.noInput;
          }
          let inputInfo = availableParser.inputs[data["input"]];
          if (!inputInfo)
            return this.lang.validationErrors.parserInput.inputNotAvailable__i.interpolate(
              { name: data["input"] },
            );
          else if (!inputInfo.validationFn) {
            if (["dir", "path"].includes(inputInfo.inputType)) {
              if (data["parser"] !== "Manual" && !data["inputData"]) {
                return null;
              }
              let isDir: boolean;
              if (os.type() == "Darwin") {
                isDir = inputInfo.inputType == "dir" ? true : undefined;
              } else {
                isDir = inputInfo.inputType == "dir" ? true : false;
              }
              return this.validateEnvironmentPath(
                data["inputData"] || "",
                isDir,
              )
                ? null
                : isDir
                  ? this.lang.validationErrors.genericDir__md
                  : this.lang.validationErrors.genericPath__md;
            }
            return null;
          }
          return inputInfo.validationFn(data["inputData"]);
        }
        return this.lang.validationErrors.parserInput.incorrectParser;
      }
      case "titleModifier":
        return this.validateVariableParserString(data || "");
      case "executableModifier":
        return this.validateVariableParserString(data || "");
      case "onlineImageQueries":
        if (!data) return null;
        for (let query of data) {
          let err = this.validateVariableParserString(query);
          if (!err) {
            continue;
          } else {
            return `${err}\\\nBad query: \`${query}\``;
          }
        }
        return null;
      case "executableArgs":
        return this.validateVariableParserString(data || "");
      case "imagePool":
        return this.validateVariableParserString(data || "");
      case "defaultImage":
        return !data || this.validateEnvironmentPath(data, false)
          ? null
          : this.lang.validationErrors.defaultImage__md;
      case "localImages": {
        return this.fileParser.validateFieldGlob(data || "");
      }
      default:
        return this.lang.validationErrors.unhandledValidationKey__md;
    }
  }

  private validateVariableParserString(input: string, emptyError?: string) {
    let canBeEmpty = !emptyError;
    const trimmed = input.trim();
    if (canBeEmpty || (!canBeEmpty && trimmed.length > 0)) {
      return VariableParser.isValidString("${", "}", trimmed)
        ? null
        : this.lang.validationErrors.variableString__md;
    } else {
      return emptyError;
    }
  }

  private validateEnvironmentPath(
    pathwithvar: string,
    checkForDirectory: boolean,
  ) {
    let preParser = new VariableParser({ left: "${", right: "}" });
    let parsedPath = preParser.setInput(pathwithvar).parse()
      ? preParser.replaceVariables((variable) => {
          return this.fileParser
            .getEnvironmentVariable(
              variable as EnvironmentVariables,
              this.appSettings,
            )
            .trim();
        })
      : "";
    return file.validatePath(parsedPath, checkForDirectory);
  }

  isConfigurationValid(config: UserConfiguration) {
    if (this.validate("parserType", config["parserType"]) !== null) {
      return false;
    }

    let simpleValidations: string[] = [
      "configTitle",
      "parserId",
      "steamDirectory",
      "titleModifier",
      "onlineImageQueries",
      "imagePool",
    ];

    if (
      parserInfo.superTypesMap[config["parserType"]] ===
      parserInfo.ArtworkOnlyType
    ) {
      simpleValidations = simpleValidations.concat([]);
    } else if (
      parserInfo.superTypesMap[config["parserType"]] === parserInfo.PlatformType
    ) {
      simpleValidations = simpleValidations.concat([
        "steamCategories",
        "onlineImageQueries",
        "imagePool",
      ]);
    } else if (
      parserInfo.superTypesMap[config["parserType"]] === parserInfo.ROMType
    ) {
      simpleValidations = simpleValidations.concat([
        "steamCategories",
        "executable",
        "executableModifier",
        "romDirectory",
        "startInDirectory",
        "executableArgs",
        "onlineImageQueries",
        "imagePool",
      ]);
    } else if (
      parserInfo.superTypesMap[config["parserType"]] === parserInfo.ManualType
    ) {
      simpleValidations = simpleValidations.concat([
        "steamCategories",
        "onlineImageQueries",
        "imagePool",
      ]);
    }

    if (
      this.validate("userAccounts", config["userAccounts"], {
        parserType: config["parserType"],
      }) !== null
    ) {
      return false;
    }

    for (let i = 0; i < simpleValidations.length; i++) {
      if (
        this.validate(
          simpleValidations[i],
          config[simpleValidations[i] as keyof UserConfiguration],
        ) !== null
      ) {
        return false;
      }
    }

    let availableParser = this.getParserInfo(config.parserType);
    if (availableParser.inputs !== undefined) {
      let parserInputs = config.parserInputs;
      for (let inputName in availableParser.inputs) {
        if (
          this.validate("parserInputs", {
            parser: config.parserType,
            input: inputName,
            inputData: parserInputs[inputName],
          }) !== null
        )
          return false;
      }
    }

    for (const artworkType of artworkTypes) {
      if (
        this.validate("defaultImage", config.defaultImage[artworkType]) !== null
      ) {
        return false;
      }
      if (
        this.validate("localImages", config.localImages[artworkType]) !== null
      ) {
        return false;
      }
    }

    return true;
  }
  getParserId(configurationIndex: number) {
    return this.userConfigurations.getValue()[configurationIndex].saved
      .parserId;
  }

  private readSavedControllerTemplates() {
    return new Promise<ControllerTemplates>((resolve, reject) => {
      fs.readFile(paths.controllerTemplates, "utf8", (error, data) => {
        try {
          if (error) {
            if (error.code === "ENOENT") resolve({});
            else reject(error);
          } else resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    })
      .then((data) => {
        this.savedControllerTemplates.next(data);
      })
      .catch((error) => {
        this.loggerService.error(this.lang.error.readingConfiguration, {
          invokeAlert: true,
          alertTimeout: 5000,
        });
        this.loggerService.error(error);
      });
  }

  saveControllerTemplates() {
    return new Promise<void>((resolve, reject) => {
      const stringToSave = JSON.stringify(this.controllerTemplates, null, 4);
      try {
        fs.outputFileSync(paths.controllerTemplates, stringToSave);
        resolve();
      } catch (e) {
        reject(e);
      }
    }).catch((error) => {
      this.loggerService.error(this.lang.error.savingConfiguration, {
        invokeAlert: true,
        alertTimeout: 5000,
      });
      this.loggerService.error(error);
    });
  }

  private saveUserConfigurations() {
    return new Promise<void>((resolve, reject) => {
      if (!this.savingIsDisabled) {
        const stringToSave = JSON.stringify(
          this.userConfigurations
            .getValue()
            .map((item: { saved: any; current: UserConfiguration }) => {
              item.saved[modifiers.userConfiguration.controlProperty] =
                modifiers.userConfiguration.latestVersion;
              if (!item.saved.parserType) {
                throw new Error(this.lang.error.parserTypeMissing);
              }
              for (let key of Object.keys(item.saved.parserInputs)) {
                if (
                  !parserInfo.availableParserInputs[
                    item.saved.parserType as ParserType
                  ].includes(key)
                ) {
                  delete item.saved.parserInputs[key];
                }
              }
              return item.saved;
            }),
          null,
          4,
        );
        try {
          fs.outputFileSync(paths.userConfigurations, stringToSave);
          resolve();
        } catch (e) {
          reject(e);
        }
      } else resolve();
    })
      .then()
      .catch((error) => {
        this.loggerService.error(this.lang.error.savingConfiguration, {
          invokeAlert: true,
          alertTimeout: 5000,
        });
        this.loggerService.error(error);
      });
  }

  private readUserConfigurations() {
    return new Promise<UserConfiguration[]>((resolve, reject) => {
      fs.readFile(paths.userConfigurations, "utf8", (error, data) => {
        try {
          if (error) {
            if (error.code === "ENOENT") resolve([]);
            else reject(error);
          } else {
            resolve(JSON.parse(data));
          }
        } catch (error) {
          reject(error);
        }
      });
    })
      .then((data) => {
        let validatedConfigs: {
          saved: UserConfiguration;
          current: UserConfiguration;
        }[] = [];
        let errorString: string = "";
        for (let i = 0; i < data.length; i++) {
          if (
            parserInfo.superTypesMap[data[i].parserType] !== parserInfo.ROMType
          ) {
            data[i].titleFromVariable.limitToGroups = [];
            data[i].executableModifier = "";
          }
          if (this.validator.validate(data[i]).isValid()) {
            validatedConfigs.push({ saved: data[i], current: null });
          } else {
            errorString += `\r\n[Config ${i} with title ${data[i].configTitle || ""}]:\r\n    ${this.validator.errorString.replace(/\n/g, "\n    ")}`;
          }
        }
        if (errorString.length > 0) {
          this.savingIsDisabled = true;
          this.loggerService.error(this.lang.error.readingConfiguration, {
            invokeAlert: true,
            alertTimeout: 5000,
            doNotAppendToLog: true,
          });
          this.loggerService.error(
            this.lang.error.corruptedConfiguration__i.interpolate({
              file: paths.userConfigurations,
              error: errorString,
            }),
          );
        }
        this.userConfigurations.next(validatedConfigs);
        if (data.length) {
          this.saveUserConfigurations();
        }
      })
      .then(() => {
        this.configurationsLoadedSubject.next(true);
      })
      .catch((error) => {
        this.loggerService.error(this.lang.error.readingConfiguration, {
          invokeAlert: true,
          alertTimeout: 5000,
        });
        this.loggerService.error(error);
      });
  }
}
