import { Injectable } from "@angular/core";
import {
  UserConfiguration,
  UserAccountsInfo,
  ControllerTemplates,
  ParserType,
  ParserGroup,
  ParserInfo,
} from "../../models";
import { SettingsService } from "./settings.service";
import { BehaviorSubject, Subject } from "rxjs";
import { takeWhile } from "rxjs/operators";
import * as parserInfo from "../../lib/parsers/available-parsers";
import * as _ from "lodash";
import { CoreClientService } from "./core-client.service";
import type { ParsersStore } from "../../core/parsers-store";

type ConfigEntry = { saved: UserConfiguration; current: UserConfiguration };

// The user's parsers, owned by the ParsersStore in the main process. This
// keeps a mirror of the saved parsers plus the UI's unsaved edits
// (`current`) per parser. Edits are synchronous calls, after which the
// mirror is refreshed, so the UI sees the result immediately.
@Injectable()
export class ParsersService {
  private entries = new Map<string, ConfigEntry>(); // by parser id
  private savedControllerTemplates = new Subject<ControllerTemplates>();
  private userConfigurations = new BehaviorSubject<ConfigEntry[]>([]);
  private deletedConfigurations = new BehaviorSubject<ConfigEntry[]>([]);
  private configurationsLoadedSubject = new BehaviorSubject<boolean>(false);
  private parserInfoCache = new Map<string, ParserInfo>();
  private templates: ControllerTemplates = {};

  constructor(
    private coreClient: CoreClientService,
    private settingsService: SettingsService,
  ) {
    const client = this.coreClient.client;
    client.on("parsers:changed", ({ configs, deleted }) =>
      this.publish(configs, deleted),
    );
    client.whenLoaded("parsers").then(() => {
      this.refresh();
      this.configurationsLoadedSubject.next(true);
    });
    client.whenLoaded("controllerTemplates").then(() => {
      this.templates = client.callSync(
        "parsers",
        "getControllerTemplatesCache",
      );
      this.savedControllerTemplates.next(this.templates);
    });
  }

  private callSync(method: string, ...args: any[]) {
    return this.coreClient.client.callSync("parsers", method, ...args);
  }

  private call(method: string, ...args: any[]) {
    return this.coreClient.client.call("parsers", method, ...args);
  }

  private entryFor(config: UserConfiguration): ConfigEntry {
    let entry = this.entries.get(config.parserId);
    if (!entry) {
      entry = { saved: config, current: null };
      this.entries.set(config.parserId, entry);
    } else {
      entry.saved = config;
    }
    return entry;
  }

  private publish(configs: UserConfiguration[], deleted: UserConfiguration[]) {
    this.userConfigurations.next(configs.map((c) => this.entryFor(c)));
    this.deletedConfigurations.next(deleted.map((c) => this.entryFor(c)));
  }

  // Re-reads the parsers (and settings, which hold the groups) after an
  // edit in the main process.
  private refresh() {
    this.publish(this.callSync("getAll"), this.callSync("getDeleted"));
    this.coreClient.client.markFresh("parsers:changed");
    this.settingsService.refresh();
  }

  private edit(method: string, ...args: any[]) {
    const result = this.callSync(method, ...args);
    this.refresh();
    return result;
  }

  get controllerTemplates() {
    return this.templates;
  }

  set controllerTemplates(controllerTemplates: ControllerTemplates) {
    this.templates = controllerTemplates;
  }

  onLoad(callback: (userConfigurations: UserConfiguration[]) => void) {
    this.configurationsLoadedSubject
      .asObservable()
      .pipe(
        takeWhile((loaded) => {
          if (loaded) {
            callback(
              this.getUserConfigurationsArray().map((e) =>
                _.cloneDeep(e.saved),
              ),
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

  getControllerTemplates(steamDir: string, controllerType: string) {
    return this.call("getControllerTemplates", steamDir, controllerType);
  }

  removeControllers(steamDir: string, userId: string, parserId?: string) {
    return this.call("removeControllers", steamDir, userId, parserId);
  }

  removeAllControllers() {
    return this.call("removeAllControllers");
  }

  parseSteamDir(steamDirInput: string): string {
    return this.callSync("parseSteamDir", steamDirInput);
  }

  parseUserAccounts(
    accountsInfo: UserAccountsInfo,
    steamDir: string,
  ): Promise<string[]> {
    return this.call("parseUserAccounts", accountsInfo, steamDir);
  }

  getKnownSteamDirectories(): string[] {
    return this.callSync("getKnownSteamDirectories");
  }

  getDeletedConfigurations() {
    return this.deletedConfigurations.asObservable();
  }

  getDefaultValues(): UserConfiguration {
    return this.callSync("getDefaultValues");
  }

  saveConfiguration(config: ConfigEntry) {
    this.edit("add", config.saved);
  }

  swapIndex(fromIndex: number, toIndex: number) {
    this.edit("swapIndex", fromIndex, toIndex);
  }

  injectIndex(fromIndex: number, toIndex: number) {
    this.edit("injectIndex", fromIndex, toIndex);
  }

  moveParser(fromIndex: number, toIndex: number, newGroup?: string) {
    const entry = this.getUserConfigurationsArray()[fromIndex];
    if (entry?.current && newGroup !== undefined) {
      entry.current.group = newGroup;
    }
    this.edit("moveParser", fromIndex, toIndex, newGroup);
  }

  getParserGroups(): ParserGroup[] {
    const settings = this.settingsService.getSettings();
    if (!settings.parserGroups) {
      settings.parserGroups = [];
    }
    return settings.parserGroups;
  }

  addGroup(name: string) {
    this.edit("addGroup", name);
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
    this.edit("renameGroup", oldName, newName);
  }

  removeGroup(name: string) {
    this.regroupDrafts(name, "");
    this.edit("removeGroup", name);
  }

  reorderGroups(fromIndex: number, toIndex: number) {
    this.edit("reorderGroups", fromIndex, toIndex);
  }

  setGroupCollapsed(name: string, collapsed: boolean) {
    this.edit("setGroupCollapsed", name, collapsed);
  }

  async changeGroupEnabledStatus(groupName: string, enabled: boolean) {
    await this.call("setGroupEnabled", groupName, enabled);
    this.refresh();
  }

  // Throws (synchronously) for an unknown id, like the store.
  changeEnabledStatus(parserId: string, enabled: boolean): Promise<void> {
    if (
      !this.getUserConfigurationsArray().some(
        (e) => e.saved.parserId === parserId,
      )
    ) {
      throw `Could not ${enabled ? "enable" : "disable"} ${parserId}. No such parser exists.`;
    }
    return this.call("setEnabled", parserId, enabled).then(() =>
      this.refresh(),
    );
  }

  async changeEnabledStatusAll(enabled: boolean) {
    await this.call("setAllEnabled", enabled);
    this.refresh();
  }

  // Saves the unsaved edits of parser `index` (or replaces it with `config`).
  updateConfiguration(index: number, config?: UserConfiguration) {
    const entry = this.getUserConfigurationsArray()[index];
    if (config === undefined) {
      if (entry.current == null) return;
      config = _.cloneDeep(entry.current);
      if (
        parserInfo.superTypesMap[config.parserType] ===
        parserInfo.ArtworkOnlyType
      ) {
        config.titleFromVariable.limitToGroups = [];
      }
    }
    entry.current = null;
    this.edit("update", index, config);
  }

  setCurrentConfiguration(index: number, config: UserConfiguration) {
    this.getUserConfigurationsArray()[index].current = config;
    this.userConfigurations.next([...this.getUserConfigurationsArray()]);
  }

  deleteConfiguration(index: number) {
    this.edit("delete", index);
  }

  restoreConfiguration(index?: number) {
    this.edit("restore", index);
  }

  // Parser labels/inputs/docs (static; cached).
  getParserInfo(parserType: ParserType): ParserInfo {
    if (!this.parserInfoCache.has(parserType)) {
      this.parserInfoCache.set(
        parserType,
        this.callSync("getParserInfoForUi", parserType),
      );
    }
    return this.parserInfoCache.get(parserType);
  }

  executeFileParser(
    ...configs: UserConfiguration[]
  ): ReturnType<ParsersStore["executeFileParser"]> {
    this.settingsService.push();
    return this.call("executeFileParser", ...configs);
  }

  validate(key: string, data: any, options?: any): string | null {
    return this.callSync("validate", key, data, options);
  }

  isConfigurationValid(config: UserConfiguration): boolean {
    return this.callSync("isConfigurationValid", config);
  }

  getParserId(configurationIndex: number) {
    return this.getUserConfigurationsArray()[configurationIndex].saved.parserId;
  }

  async saveControllerTemplates() {
    this.callSync("setControllerTemplatesCache", this.templates);
    await this.call("saveControllerTemplates");
  }
}
