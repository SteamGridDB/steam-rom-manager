import {
  UserConfiguration,
  UserAccountsInfo,
  EnvironmentVariables,
  ControllerTemplates,
  ParserType,
  ParserGroup,
  Logger,
  CustomVariables,
  UserExceptions,
} from "../models";
import { FileParser } from "../lib/file-parser";
import { FuzzyMatcher } from "../lib/fuzzy-matcher";
import { VariableParser } from "../lib/variable-parser";
import { ControllerManager } from "../lib/controller-manager";
import { artworkTypes } from "../lib/artwork-types";
import { APP } from "../variables";
import * as json from "../lib/helpers/json";
import * as file from "../lib/helpers/file";
import * as parserInfo from "../lib/parsers/available-parsers";
import * as unique_ids from "../lib/helpers/unique-ids";
import * as steam from "../lib/helpers/steam";
import * as paths from "../paths";
import * as schemas from "./schemas";
import * as modifiers from "./modifiers";
import { SettingsStore } from "./settings-store";
import * as path from "path";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as os from "os";

type Listener = (configs: UserConfiguration[]) => void;

// The user's parsers (userConfigurations.json): load/validate/save, CRUD and
// ordering, groups, enable/disable, validation, and running them through the
// FileParser. Parser groups live in the app settings.
export class ParsersStore {
  private configs: UserConfiguration[] = [];
  private deleted: UserConfiguration[] = [];
  private listeners = new Set<Listener>();
  private validator = new json.Validator(
    schemas.userConfiguration,
    modifiers.userConfiguration,
  );
  private defaultValidator = new json.Validator(
    schemas.defaultUserConfiguration,
    modifiers.userConfiguration,
  );
  readonly fileParser: FileParser;
  controllerTemplates: ControllerTemplates = {};
  // Set when userConfigurations.json couldn't be fully used, so the user's
  // file is never overwritten with a partial list.
  savingIsDisabled = false;

  constructor(
    private logger: Logger,
    private settings: SettingsStore,
    fuzzy: { fuzzyMatcher: FuzzyMatcher },
  ) {
    this.fileParser = new FileParser(fuzzy);
  }

  private get lang() {
    return APP.lang.parsers.service;
  }

  // ---- state ----

  getAll(): UserConfiguration[] {
    return this.configs;
  }

  getDeleted(): UserConfiguration[] {
    return this.deleted;
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed() {
    for (const listener of this.listeners) {
      listener(this.configs);
    }
  }

  setCustomVariables(variables: CustomVariables) {
    this.fileParser.setCustomVariables(variables);
  }

  setUserExceptions(exceptions: UserExceptions) {
    this.fileParser.setUserExceptions(exceptions);
  }

  getDefaultValues() {
    return this.defaultValidator.getDefaultValues() as UserConfiguration;
  }

  getParserInfo(parserType: ParserType) {
    return this.fileParser.getParserInfo(parserType);
  }

  // Parser info as plain data for a UI in another process (labels, inputs,
  // docs); validation functions are left out (use validate()).
  getParserInfoForUi(parserType: ParserType) {
    const info = this.getParserInfo(parserType);
    return info ? JSON.parse(JSON.stringify(info)) : undefined;
  }

  getControllerTemplatesCache(): ControllerTemplates {
    return this.controllerTemplates;
  }

  setControllerTemplatesCache(templates: ControllerTemplates) {
    this.controllerTemplates = templates;
  }

  getParserId(index: number) {
    return this.configs[index].parserId;
  }

  // ---- persistence ----

  // Always settles: an unreadable file is reported and disables saving
  // rather than leaving callers waiting.
  async load(): Promise<UserConfiguration[]> {
    let data: UserConfiguration[];
    try {
      data = await fs.readJson(paths.userConfigurations);
    } catch (error) {
      if (error.code === "ENOENT") {
        data = [];
      } else {
        this.savingIsDisabled = true;
        this.logger.error(this.lang.error.readingConfiguration, {
          invokeAlert: true,
          alertTimeout: 5000,
        });
        this.logger.error(error);
        this.configs = [];
        this.changed();
        return this.configs;
      }
    }

    const validated: UserConfiguration[] = [];
    let errorString = "";
    for (let i = 0; i < data.length; i++) {
      if (parserInfo.superTypesMap[data[i].parserType] !== parserInfo.ROMType) {
        data[i].titleFromVariable.limitToGroups = [];
        data[i].executableModifier = "";
      }
      if (this.validator.validate(data[i]).isValid()) {
        validated.push(data[i]);
      } else {
        errorString += `\r\n[Config ${i} with title ${data[i].configTitle || ""}]:\r\n    ${this.validator.errorString.replace(/\n/g, "\n    ")}`;
      }
    }
    if (errorString.length > 0) {
      this.savingIsDisabled = true;
      this.logger.error(this.lang.error.readingConfiguration, {
        invokeAlert: true,
        alertTimeout: 5000,
        doNotAppendToLog: true,
      });
      this.logger.error(
        this.lang.error.corruptedConfiguration__i.interpolate({
          file: paths.userConfigurations,
          error: errorString,
        }),
      );
    }
    this.configs = validated;
    this.changed();
    if (data.length) {
      await this.save();
    }
    return this.configs;
  }

  async save(): Promise<void> {
    if (this.savingIsDisabled) {
      return;
    }
    try {
      const toSave = this.configs.map((config) => {
        (config as any)[modifiers.userConfiguration.controlProperty] =
          modifiers.userConfiguration.latestVersion;
        if (!config.parserType) {
          throw new Error(this.lang.error.parserTypeMissing);
        }
        for (const key of Object.keys(config.parserInputs)) {
          if (
            !parserInfo.availableParserInputs[
              config.parserType as ParserType
            ].includes(key)
          ) {
            delete config.parserInputs[key];
          }
        }
        return config;
      });
      json.writeFileAtomicSync(
        paths.userConfigurations,
        JSON.stringify(toSave, null, 4),
      );
    } catch (error) {
      this.logger.error(this.lang.error.savingConfiguration, {
        invokeAlert: true,
        alertTimeout: 5000,
      });
      this.logger.error(error);
    }
  }

  // ---- editing ----

  // Adds a new parser (a fresh id, enabled); returns it.
  add(config: UserConfiguration): UserConfiguration {
    const copy = _.cloneDeep(config);
    copy.parserId = unique_ids.newParserId();
    copy.disabled = false;
    copy.group = (copy.group || "").trim();
    this.configs = this.configs.concat(copy);
    this.changed();
    if (copy.group) {
      this.addGroup(copy.group);
    }
    this.save();
    return copy;
  }

  // Replaces the parser at `index`, keeping its id.
  update(index: number, config: UserConfiguration) {
    config.parserId = this.configs[index].parserId;
    config.group = (config.group || "").trim();
    this.configs[index] = config;
    this.changed();
    if (config.group) {
      this.addGroup(config.group);
    }
    this.save();
  }

  swapIndex(fromIndex: number, toIndex: number) {
    if (fromIndex == toIndex) {
      return;
    }
    if (fromIndex >= this.configs.length || toIndex >= this.configs.length) {
      throw "Index out of bounds";
    }
    const from = this.configs[fromIndex];
    this.configs[fromIndex] = this.configs[toIndex];
    this.configs[toIndex] = from;
    this.changed();
    this.save();
  }

  injectIndex(fromIndex: number, toIndex: number) {
    if (fromIndex == toIndex) {
      return;
    }
    if (fromIndex >= this.configs.length || toIndex >= this.configs.length) {
      throw "Index out of bounds";
    }
    const from = this.configs[fromIndex];
    const withoutFrom = this.configs.filter((_, i) => i !== fromIndex);
    this.configs = withoutFrom
      .slice(0, toIndex)
      .concat(from)
      .concat(withoutFrom.slice(toIndex));
    this.changed();
    this.save();
  }

  // Moves a parser to a new position, optionally reassigning its group.
  // toIndex is the target index after the parser is removed.
  moveParser(fromIndex: number, toIndex: number, newGroup?: string) {
    if (fromIndex < 0 || fromIndex >= this.configs.length) {
      throw "Index out of bounds";
    }
    const from = this.configs[fromIndex];
    const groupChanged = newGroup !== undefined && from.group !== newGroup;
    if (fromIndex === toIndex && !groupChanged) {
      return;
    }
    if (newGroup !== undefined) {
      from.group = newGroup;
    }
    const withoutFrom = this.configs.filter((_, i) => i !== fromIndex);
    const clampedTo = Math.max(0, Math.min(toIndex, withoutFrom.length));
    this.configs = withoutFrom
      .slice(0, clampedTo)
      .concat(from)
      .concat(withoutFrom.slice(clampedTo));
    this.changed();
    this.save();
  }

  delete(index: number) {
    if (index >= 0 && index < this.configs.length) {
      this.deleted = this.deleted.concat(this.configs.splice(index, 1));
      this.configs = [...this.configs];
      this.changed();
      this.save();
    }
  }

  restore(index: number = 0) {
    if (index >= 0 && index < this.deleted.length) {
      this.configs = this.configs.concat(this.deleted.splice(index, 1));
      this.deleted = [...this.deleted];
      this.changed();
      this.save();
    }
  }

  // ---- groups (stored in app settings) ----

  getParserGroups(): ParserGroup[] {
    const settings = this.settings.get();
    if (!settings.parserGroups) {
      settings.parserGroups = [];
    }
    return settings.parserGroups;
  }

  private commitGroups() {
    this.settings.save();
    this.settings.changed();
  }

  addGroup(name: string) {
    name = (name || "").trim();
    if (!name) {
      return;
    }
    const groups = this.getParserGroups();
    if (!groups.some((g) => g.name === name)) {
      groups.push({ name, collapsed: false });
      this.commitGroups();
    }
  }

  renameGroup(oldName: string, newName: string) {
    newName = (newName || "").trim();
    if (!newName || oldName === newName) {
      return;
    }
    const groups = this.getParserGroups();
    const oldIndex = groups.findIndex((g) => g.name === oldName);
    if (oldIndex === -1) {
      return;
    }
    if (groups.some((g) => g.name === newName)) {
      // Merge into the existing group by dropping the old registry entry.
      groups.splice(oldIndex, 1);
    } else {
      groups[oldIndex].name = newName;
    }
    for (const config of this.configs) {
      if (config.group === oldName) {
        config.group = newName;
      }
    }
    this.changed();
    this.save();
    this.commitGroups();
  }

  removeGroup(name: string) {
    const groups = this.getParserGroups();
    const index = groups.findIndex((g) => g.name === name);
    if (index !== -1) {
      groups.splice(index, 1);
    }
    for (const config of this.configs) {
      if (config.group === name) {
        config.group = "";
      }
    }
    this.changed();
    this.save();
    this.commitGroups();
  }

  reorderGroups(fromIndex: number, toIndex: number) {
    const groups = this.getParserGroups();
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      fromIndex >= groups.length ||
      toIndex < 0 ||
      toIndex >= groups.length
    ) {
      return;
    }
    const [moved] = groups.splice(fromIndex, 1);
    groups.splice(toIndex, 0, moved);
    this.commitGroups();
  }

  setGroupCollapsed(name: string, collapsed: boolean) {
    const group = this.getParserGroups().find((g) => g.name === name);
    if (group) {
      group.collapsed = collapsed;
      this.commitGroups();
    }
  }

  // ---- enable/disable ----

  setGroupEnabled(groupName: string, enabled: boolean): Promise<void> {
    for (const config of this.configs) {
      if (config.group === groupName) {
        config.disabled = !enabled;
      }
    }
    this.changed();
    return this.save();
  }

  // Throws (synchronously) for an unknown id.
  setEnabled(parserId: string, enabled: boolean): Promise<void> {
    const config = this.configs.find((c) => c.parserId === parserId);
    if (!config) {
      throw `Could not ${enabled ? "enable" : "disable"} ${parserId}. No such parser exists.`;
    }
    config.disabled = !enabled;
    this.changed();
    return this.save();
  }

  setAllEnabled(enabled: boolean): Promise<void> {
    for (const config of this.configs) {
      config.disabled = !enabled;
    }
    this.changed();
    return this.save();
  }

  // ---- running ----

  // Runs the given configs (default: all enabled ones) through the parsers.
  executeFileParser(...configs: UserConfiguration[]) {
    const invalid: string[] = [];
    const skipped: string[] = [];
    const valid: UserConfiguration[] = [];
    if (configs.length === 0) {
      for (const config of this.configs) {
        if (config.disabled) skipped.push(config.configTitle);
        else configs.push(config);
      }
    }
    for (const config of _.cloneDeep(configs)) {
      if (this.isConfigurationValid(config)) valid.push(config);
      else invalid.push(config.configTitle || this.lang.text.noTitle);
    }
    return this.fileParser
      .executeFileParser(valid, this.settings.get())
      .then((parsedData) => ({ parsedData, invalid, skipped }));
  }

  parseSteamDir(steamDirInput: string) {
    const preParser = new VariableParser({ left: "${", right: "}" });
    return preParser.setInput(steamDirInput).parse()
      ? preParser.replaceVariables((variable) =>
          this.fileParser
            .getEnvironmentVariable(
              variable as EnvironmentVariables,
              this.settings.get(),
            )
            .trim(),
        )
      : "";
  }

  async parseUserAccounts(accountsInfo: UserAccountsInfo, steamDir: string) {
    const useGlobal =
      accountsInfo.specifiedAccounts.length &&
      accountsInfo.specifiedAccounts[0] == "Global";
    const accountList = useGlobal
      ? this.settings.get().environmentVariables.userAccounts
      : accountsInfo.specifiedAccounts;
    const data = (await steam.getAvailableLogins(steamDir)).filter((x) =>
      fs.existsSync(path.join(steamDir, "userdata", x.accountID)),
    );
    return accountList.length
      ? data
          .filter((x) => accountList.indexOf(x.name) > -1)
          .map((x) => x.accountID)
      : data.map((x) => x.accountID);
  }

  getKnownSteamDirectories() {
    const steamDirs = this.configs
      .map((config) => this.parseSteamDir(config.steamDirectory))
      .filter((dir) => dir !== "");
    const global = this.settings.get().environmentVariables.steamDirectory;
    if (global) {
      steamDirs.push(global);
    }
    return _.uniq(steamDirs);
  }

  // ---- controllers ----

  async readControllerTemplates(): Promise<ControllerTemplates> {
    try {
      this.controllerTemplates = await fs.readJson(paths.controllerTemplates);
    } catch (error) {
      if (error.code !== "ENOENT") {
        this.logger.error(this.lang.error.readingConfiguration, {
          invokeAlert: true,
          alertTimeout: 5000,
        });
        this.logger.error(error);
      }
      this.controllerTemplates = {};
    }
    return this.controllerTemplates;
  }

  async saveControllerTemplates(): Promise<void> {
    try {
      json.writeFileAtomicSync(
        paths.controllerTemplates,
        JSON.stringify(this.controllerTemplates, null, 4),
      );
    } catch (error) {
      this.logger.error(this.lang.error.savingConfiguration, {
        invokeAlert: true,
        alertTimeout: 5000,
      });
      this.logger.error(error);
    }
  }

  async getControllerTemplates(steamDir: string, controllerType: string) {
    return (await this.getAllControllerTemplates(steamDir))?.[controllerType];
  }

  // Every controller type's templates (one pass over the files).
  async getAllControllerTemplates(steamDir: string) {
    try {
      return await ControllerManager.readAllTemplates(steamDir);
    } catch (error) {
      this.logger.error(this.lang.error.fetchingTemplates, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(error);
    }
  }

  removeControllers(steamDir: string, userId: string, parserId?: string) {
    const controllerManager = new ControllerManager();
    controllerManager.removeAllControllersAndWrite(steamDir, userId, parserId);
    controllerManager.removeAllControllersEnabledAndWrite(
      steamDir,
      userId,
      parserId,
    );
  }

  // Removes SRM's controller templates for every account of every known
  // Steam install.
  async removeAllControllers() {
    for (const steamDir of this.getKnownSteamDirectories()) {
      for (const account of await steam.getAvailableLogins(steamDir)) {
        this.removeControllers(steamDir, account.accountID);
      }
    }
  }

  // ---- validation ----

  validate(key: string, data: any, options?: any): string | null {
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
      case "executable": {
        const isDir = os.type() == "Darwin" ? undefined : false;
        return !(data || {}).path ||
          this.validateEnvironmentPath(data.path, isDir)
          ? null
          : this.lang.validationErrors.executable__md;
      }
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
        const availableParser = this.getParserInfo(data["parser"]);
        if (!availableParser) {
          return this.lang.validationErrors.parserInput.incorrectParser;
        }
        if (availableParser.inputs === undefined) {
          return this.lang.validationErrors.parserInput.noInput;
        }
        const inputInfo = availableParser.inputs[data["input"]];
        if (!inputInfo) {
          return this.lang.validationErrors.parserInput.inputNotAvailable__i.interpolate(
            { name: data["input"] },
          );
        }
        if (inputInfo.required && !data["inputData"]) {
          return this.lang.validationErrors.parserInput.fieldRequired__i.interpolate(
            { inputName: inputInfo.label },
          );
        }
        if (inputInfo.validationFn) {
          return inputInfo.validationFn(data["inputData"]);
        }
        if (["dir", "path"].includes(inputInfo.inputType)) {
          if (data["parser"] !== "Manual" && !data["inputData"]) {
            return null;
          }
          let isDir: boolean;
          if (os.type() == "Darwin") {
            isDir = inputInfo.inputType == "dir" ? true : undefined;
          } else {
            isDir = inputInfo.inputType == "dir";
          }
          return this.validateEnvironmentPath(data["inputData"] || "", isDir)
            ? null
            : isDir
              ? this.lang.validationErrors.genericDir__md
              : this.lang.validationErrors.genericPath__md;
        }
        return null;
      }
      case "titleModifier":
      case "executableModifier":
      case "executableArgs":
      case "imagePool":
        return this.validateVariableParserString(data || "");
      case "onlineImageQueries":
        if (!data) return null;
        for (const query of data) {
          const err = this.validateVariableParserString(query);
          if (err) {
            return `${err}\\\nBad query: \`${query}\``;
          }
        }
        return null;
      case "defaultImage":
        return !data || this.validateEnvironmentPath(data, false)
          ? null
          : this.lang.validationErrors.defaultImage__md;
      case "localImages":
        return this.fileParser.validateFieldGlob(data || "");
      default:
        return this.lang.validationErrors.unhandledValidationKey__md;
    }
  }

  private validateVariableParserString(input: string) {
    return VariableParser.isValidString("${", "}", input.trim())
      ? null
      : this.lang.validationErrors.variableString__md;
  }

  private validateEnvironmentPath(
    pathWithVar: string,
    checkForDirectory: boolean,
  ) {
    const preParser = new VariableParser({ left: "${", right: "}" });
    const parsedPath = preParser.setInput(pathWithVar).parse()
      ? preParser.replaceVariables((variable) =>
          this.fileParser
            .getEnvironmentVariable(
              variable as EnvironmentVariables,
              this.settings.get(),
            )
            .trim(),
        )
      : "";
    return file.validatePath(parsedPath, checkForDirectory);
  }

  isConfigurationValid(config: UserConfiguration) {
    if (this.validate("parserType", config.parserType) !== null) {
      return false;
    }
    let simpleValidations = [
      "configTitle",
      "parserId",
      "steamDirectory",
      "titleModifier",
      "onlineImageQueries",
      "imagePool",
    ];
    const superType = parserInfo.superTypesMap[config.parserType];
    if (superType === parserInfo.ROMType) {
      simpleValidations = simpleValidations.concat([
        "steamCategories",
        "executable",
        "executableModifier",
        "romDirectory",
        "startInDirectory",
        "executableArgs",
      ]);
    } else if (
      superType === parserInfo.PlatformType ||
      superType === parserInfo.ManualType
    ) {
      simpleValidations = simpleValidations.concat(["steamCategories"]);
    }
    if (this.validate("userAccounts", config.userAccounts) !== null) {
      return false;
    }
    for (const key of simpleValidations) {
      if (this.validate(key, config[key as keyof UserConfiguration]) !== null) {
        return false;
      }
    }
    const availableParser = this.getParserInfo(config.parserType);
    if (availableParser.inputs !== undefined) {
      for (const inputName in availableParser.inputs) {
        if (
          this.validate("parserInputs", {
            parser: config.parserType,
            input: inputName,
            inputData: config.parserInputs[inputName],
          }) !== null
        ) {
          return false;
        }
      }
    }
    for (const artworkType of artworkTypes) {
      if (
        this.validate("defaultImage", config.defaultImage[artworkType]) !==
          null ||
        this.validate("localImages", config.localImages[artworkType]) !== null
      ) {
        return false;
      }
    }
    return true;
  }
}
