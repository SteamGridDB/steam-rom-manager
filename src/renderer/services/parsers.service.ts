import { CustomVariablesService } from "./custom-variables.service";
import { UserExceptionsService } from "./user-exceptions.service";
import { Injectable } from "@angular/core";
import {
  UserConfiguration,
  UserAccountsInfo,
  ControllerTemplates,
  ParserType,
  ParserGroup,
} from "../../models";
import { LoggerService } from "./logger.service";
import { FuzzyService } from "./fuzzy.service";
import { SettingsService } from "./settings.service";
import { BehaviorSubject, Subject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import * as parserInfo from "../../lib/parsers/available-parsers";
import { ParsersStore } from "../../core/parsers-store";
import * as _ from "lodash";

type ConfigEntry = { saved: UserConfiguration; current: UserConfiguration };

// Angular facade over the core ParsersStore. The store holds the saved
// parsers; this adds the UI's unsaved edits (`current`) for each of them,
// matched to the store's configs by object identity so they survive
// reordering.
@Injectable()
export class ParsersService {
  readonly store: ParsersStore;
  private entries = new Map<UserConfiguration, ConfigEntry>();
  private savedControllerTemplates = new Subject<ControllerTemplates>();
  private userConfigurations = new BehaviorSubject<ConfigEntry[]>([]);
  private deletedConfigurations = new BehaviorSubject<ConfigEntry[]>([]);
  private configurationsLoadedSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private fuzzyService: FuzzyService,
    private loggerService: LoggerService,
    private cVariableService: CustomVariablesService,
    private exceptionsService: UserExceptionsService,
    private settingsService: SettingsService,
  ) {
    this.store = new ParsersStore(
      this.loggerService,
      this.settingsService.store,
      this.fuzzyService,
    );
    this.store.onChange(() => this.publish());
    this.store
      .load()
      .then(() => this.configurationsLoadedSubject.next(true));
    this.store
      .readControllerTemplates()
      .then((templates) => this.savedControllerTemplates.next(templates));
    this.cVariableService.dataObservable.subscribe((variables) => {
      this.store.setCustomVariables(variables);
    });
    this.exceptionsService.dataObservable.subscribe((data) => {
      this.store.setUserExceptions(data.saved || { titles: {} });
    });
  }

  private entryFor(config: UserConfiguration): ConfigEntry {
    let entry = this.entries.get(config);
    if (!entry) {
      entry = { saved: config, current: null };
      this.entries.set(config, entry);
    }
    return entry;
  }

  private publish() {
    this.userConfigurations.next(
      this.store.getAll().map((c) => this.entryFor(c)),
    );
    this.deletedConfigurations.next(
      this.store.getDeleted().map((c) => this.entryFor(c)),
    );
  }

  get controllerTemplates() {
    return this.store.controllerTemplates;
  }

  set controllerTemplates(controllerTemplates: ControllerTemplates) {
    this.store.controllerTemplates = controllerTemplates;
  }

  onLoad(callback: (userConfigurations: UserConfiguration[]) => void) {
    this.configurationsLoadedSubject
      .asObservable()
      .pipe(
        takeWhile((loaded) => {
          if (loaded) {
            callback(this.store.getAll().map((c) => _.cloneDeep(c)));
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

  getControllerTemplates(steamDir: string, controllerType: string) {
    return this.store.getControllerTemplates(steamDir, controllerType);
  }

  removeControllers(steamDir: string, userId: string, parserId?: string) {
    this.store.removeControllers(steamDir, userId, parserId);
  }

  parseSteamDir(steamDirInput: string) {
    return this.store.parseSteamDir(steamDirInput);
  }

  parseUserAccounts(accountsInfo: UserAccountsInfo, steamDir: string) {
    return this.store.parseUserAccounts(accountsInfo, steamDir);
  }

  getKnownSteamDirectories() {
    return this.store.getKnownSteamDirectories();
  }

  getDeletedConfigurations() {
    return this.deletedConfigurations.asObservable();
  }

  getDefaultValues() {
    return this.store.getDefaultValues();
  }

  saveConfiguration(config: ConfigEntry) {
    this.store.add(config.saved);
  }

  swapIndex(fromIndex: number, toIndex: number) {
    this.store.swapIndex(fromIndex, toIndex);
  }

  injectIndex(fromIndex: number, toIndex: number) {
    this.store.injectIndex(fromIndex, toIndex);
  }

  moveParser(fromIndex: number, toIndex: number, newGroup?: string) {
    const entry = this.getUserConfigurationsArray()[fromIndex];
    if (entry?.current && newGroup !== undefined) {
      entry.current.group = newGroup;
    }
    this.store.moveParser(fromIndex, toIndex, newGroup);
  }

  getParserGroups(): ParserGroup[] {
    return this.store.getParserGroups();
  }

  addGroup(name: string) {
    this.store.addGroup(name);
  }

  // Unsaved edits follow a group rename/removal too.
  private regroupDrafts(oldName: string, newName: string) {
    for (const entry of this.getUserConfigurationsArray()) {
      if (entry.current && entry.current.group === oldName) {
        entry.current.group = newName;
      }
    }
  }

  renameGroup(oldName: string, newName: string) {
    const trimmed = (newName || "").trim();
    if (
      trimmed &&
      oldName !== trimmed &&
      this.getParserGroups().some((g) => g.name === oldName)
    ) {
      this.regroupDrafts(oldName, trimmed);
    }
    this.store.renameGroup(oldName, newName);
  }

  removeGroup(name: string) {
    this.regroupDrafts(name, "");
    this.store.removeGroup(name);
  }

  reorderGroups(fromIndex: number, toIndex: number) {
    this.store.reorderGroups(fromIndex, toIndex);
  }

  setGroupCollapsed(name: string, collapsed: boolean) {
    this.store.setGroupCollapsed(name, collapsed);
  }

  changeGroupEnabledStatus(groupName: string, enabled: boolean): Promise<void> {
    return this.store.setGroupEnabled(groupName, enabled);
  }

  changeEnabledStatus(parserId: string, enabled: boolean): Promise<void> {
    return this.store.setEnabled(parserId, enabled);
  }

  changeEnabledStatusAll(enabled: boolean): Promise<void> {
    return this.store.setAllEnabled(enabled);
  }

  // Saves the unsaved edits of parser `index` (or replaces it with `config`).
  updateConfiguration(index: number, config?: UserConfiguration) {
    const entry = this.getUserConfigurationsArray()[index];
    if (config === undefined) {
      if (entry.current == null) return;
      config = entry.current;
      if (
        parserInfo.superTypesMap[config.parserType] ===
        parserInfo.ArtworkOnlyType
      ) {
        config.titleFromVariable.limitToGroups = [];
      }
    }
    this.store.update(index, config);
  }

  setCurrentConfiguration(index: number, config: UserConfiguration) {
    this.getUserConfigurationsArray()[index].current = config;
    this.publish();
  }

  deleteConfiguration(index: number) {
    this.store.delete(index);
  }

  restoreConfiguration(index?: number) {
    this.store.restore(index);
  }

  getParserInfo(parserType: ParserType) {
    return this.store.getParserInfo(parserType);
  }

  executeFileParser(...configs: UserConfiguration[]) {
    return this.store.executeFileParser(...configs);
  }

  validate(key: string, data: any, options?: any) {
    return this.store.validate(key, data, options);
  }

  isConfigurationValid(config: UserConfiguration) {
    return this.store.isConfigurationValid(config);
  }

  getParserId(configurationIndex: number) {
    return this.store.getParserId(configurationIndex);
  }

  saveControllerTemplates() {
    return this.store.saveControllerTemplates();
  }
}
