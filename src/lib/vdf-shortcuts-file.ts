import { VDF_ShortcutsItem } from "../models";
import { VDF_Error } from "./vdf-error";
import { APP } from "../variables";
import * as steam from "./helpers/steam";
import * as file from "./helpers/file";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";

const shortcutsParser = require("steam-shortcut-editor");

export class VDF_ShortcutsFile {
  private fileData: any = undefined;
  private indexMap: { [appId: string]: number } = undefined;
  private extraneousAppIds: string[] = [];

  constructor(private filepath: string) {}

  private get lang() {
    return APP.lang.vdfFile;
  }

  get data(): VDF_ShortcutsItem[] {
    if (this.invalid) return undefined;
    else return this.fileData["shortcuts"];
  }

  set data(value: VDF_ShortcutsItem[]) {
    if (this.valid) {
      this.fileData["shortcuts"] = value;
    }
  }
  set extraneous(value: string[]) {
    this.extraneousAppIds = value;
  }
  get extraneous() {
    return this.extraneousAppIds;
  }

  get invalid() {
    return (
      this.fileData == undefined || this.fileData["shortcuts"] == undefined
    );
  }

  get valid() {
    return !this.invalid;
  }

  // The canonical key casing SRM uses for shortcut entries (matches
  // VDF_ShortcutsItem). Steam may store these with different casing.
  private static readonly canonicalKeys = [
    "appid",
    "appname",
    "exe",
    "StartDir",
    "LaunchOptions",
    "icon",
    "tags",
  ];

  // Rename any case-variant of a canonical key to its canonical form, leaving
  // all other keys (IsHidden, AllowOverlay, LastPlayTime, etc.) untouched.
  private normalizeShortcutKeys(shortcut: any) {
    if (!shortcut || typeof shortcut !== "object") {
      return shortcut;
    }
    for (const canonical of VDF_ShortcutsFile.canonicalKeys) {
      const lower = canonical.toLowerCase();
      for (const key of Object.keys(shortcut)) {
        if (key !== canonical && key.toLowerCase() === lower) {
          if (!(canonical in shortcut)) {
            shortcut[canonical] = shortcut[key];
          }
          delete shortcut[key];
        }
      }
    }
    return shortcut;
  }

  read(skipIndexing: boolean = false) {
    return fs
      .readFile(this.filepath)
      .catch((error) => {
        if (error.code !== "ENOENT") {
          throw new VDF_Error(
            APP.lang.vdfFile.error.readingVdf__i.interpolate({
              filePath: this.filepath,
              error: error,
            }),
          );
        }
      })
      .then((data) => {
        this.fileData = !!data ? shortcutsParser.parseBuffer(data) || {} : {};
        if (this.fileData["shortcuts"] === undefined) {
          this.fileData["shortcuts"] = [];
        }

        let shortcutsData = this.data;
        // Steam writes shortcuts.vdf keys with inconsistent casing (e.g.
        // "AppName"/"Exe" when a game is added through Steam itself), while the
        // rest of SRM reads fixed lower/mixed-case keys. Normalize every entry
        // to SRM's canonical casing so consumers (View Games, merging, writing)
        // don't get blank fields (issue #715). Non-canonical keys are preserved.
        for (let i = 0; i < shortcutsData.length; i++) {
          shortcutsData[i] = this.normalizeShortcutKeys(shortcutsData[i]);
        }

        this.indexMap = {};

        if (!skipIndexing) {
          for (let i = 0; i < shortcutsData.length; i++) {
            let shortcut = shortcutsData[i];
            this.indexMap[steam.generateAppId(shortcut.exe, shortcut.appname)] =
              i;
          }
        }

        return this.data;
      })
      .catch((error) => {
        throw new VDF_Error(
          this.lang.error.corruptedVdf__i.interpolate({
            filePath: this.filepath,
            error,
          }),
        );
      });
  }

  write() {
    return Promise.resolve()
      .then(() => {
        let tempData = _.cloneDeep(this.fileData);
        let tempMap = _.cloneDeep(this.indexMap);
        for (let j = 0; j < this.extraneous.length; j++) {
          let exAppId = this.extraneous[j];
          if (tempMap[exAppId] !== undefined) {
            tempData["shortcuts"][tempMap[exAppId]] = undefined;
            tempMap[exAppId] = undefined;
          }
        }
        tempData["shortcuts"] = (
          tempData["shortcuts"] as VDF_ShortcutsItem[]
        ).filter((item) => item !== undefined);
        let data = shortcutsParser.writeBuffer(tempData);
        let out = fs.outputFile(this.filepath, data);
        this.fileData = tempData;
        this.indexMap = tempMap;
        return out;
      })
      .catch((error) => {
        throw new VDF_Error(
          this.lang.error.writingVdf__i.interpolate({
            filePath: this.filepath,
            error: error,
          }),
        );
      });
  }

  backup(ext: string, overwrite: boolean = false) {
    return file.backup(this.filepath, ext, overwrite).catch((error) => {
      if (error.code !== "ENOENT") {
        throw new VDF_Error(
          this.lang.error.creatingBackup__i.interpolate({
            filePath: this.filepath,
            error: error,
          }),
        );
      }
    });
  }

  getItem(appId: string) {
    if (this.valid && this.indexMap[appId] !== undefined)
      return this.fileData["shortcuts"][this.indexMap[appId]];
    else return undefined;
  }

  removeItem(appId: string) {
    if (this.valid && this.indexMap[appId] !== undefined) {
      this.fileData["shortcuts"][this.indexMap[appId]] = undefined;
      this.indexMap[appId] = undefined;
    }
  }

  addItem(appId: string, value: VDF_ShortcutsItem) {
    if (this.valid && this.indexMap[appId] === undefined) {
      this.fileData["shortcuts"].push(value);
      this.indexMap[appId] = this.fileData["shortcuts"].length - 1;
    }
  }

  getAppIds() {
    return Object.keys(this.indexMap);
  }
}
