import { VDF_ShortcutsItem } from "../models";
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as steam from './helpers/steam';
import * as json from './helpers/json';
import * as file from './helpers/file';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';

const shortcutsParser = require('steam-shortcut-editor');


export class VDF_ShortcutsFile {
  private fileData: any = undefined;
  private indexMap: { [appId: string]: number } = undefined;
  private extraneousAppIds: string[] = [];


  constructor(private filepath: string) { }

  private get lang() {
    return APP.lang.vdfFile;
  }

  get data(): VDF_ShortcutsItem[] {
    if (this.invalid)
      return undefined;
    else
      return this.fileData['shortcuts'];
  }

  set data(value: VDF_ShortcutsItem[]) {
    if (this.valid) {
      this.fileData['shortcuts'] = value;
    }
  }
  set extraneous(value: string[]) {
    this.extraneousAppIds = value;
  }
  get extraneous() {
    return this.extraneousAppIds;
  }

  get invalid() {
    return this.fileData == undefined || this.fileData['shortcuts'] == undefined;
  }

  get valid() {
    return !this.invalid;
  }



  read(skipIndexing: boolean = false) {
    return fs.readFile(this.filepath).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw new VDF_Error(APP.lang.vdfFile.error.readingVdf__i.interpolate({
          filePath: this.filepath,
          error: error
        }));
      }
    }).then((data) => {
      this.fileData = !!data ? shortcutsParser.parseBuffer(data) || {} : {};
      if (this.fileData['shortcuts'] === undefined) {
        this.fileData['shortcuts'] = [];
      }

      let shortcutsData = this.data;
      this.indexMap = {};

      if (!skipIndexing) {
        for (let i = 0; i < shortcutsData.length; i++) {
          let shortcut = shortcutsData[i];
          let exe = json.caselessGet(shortcut, [['exe']]);
          let appname = json.caselessGet(shortcut, [['appname']]);
          this.indexMap[steam.generateAppId(exe,appname)] = i;
        }
      }

      return this.data;
    }).catch((error) => {
      throw new VDF_Error(this.lang.error.corruptedVdf__i.interpolate({
        filePath: this.filepath,
        error
      }));
    });
  }

  write() {
    return Promise.resolve().then(() => {
      let tempData = _.cloneDeep(this.fileData);
      let tempMap = _.cloneDeep(this.indexMap);
      for(let j=0; j < this.extraneous.length; j++) {
        let exAppId = this.extraneous[j]
        if (tempMap[exAppId] !== undefined) {
          tempData['shortcuts'][tempMap[exAppId]] = undefined;
          tempMap[exAppId] = undefined;
        }
      }
      tempData['shortcuts'] = (tempData['shortcuts'] as VDF_ShortcutsItem[]).filter(item => item !== undefined);
      let data = shortcutsParser.writeBuffer(tempData);
      let out = fs.outputFile(this.filepath, data);
      this.fileData = tempData;
      this.indexMap = tempMap;
      return out;
    })
    .catch((error) => {
      throw new VDF_Error(this.lang.error.writingVdf__i.interpolate({
        filePath: this.filepath,
        error: error
      }));
    });
  }

  backup(ext: string, overwrite: boolean = false) {
    return file.backup(this.filepath, ext, overwrite).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw new VDF_Error(this.lang.error.creatingBackup__i.interpolate({
          filePath: this.filepath,
          error: error
        }));
      }
    });
  }

  getItem(appId: string) {
    if (this.valid && this.indexMap[appId] !== undefined)
      return this.fileData['shortcuts'][this.indexMap[appId]];
    else
      return undefined;
  }

  removeItem(appId: string) {
    if (this.valid && this.indexMap[appId] !== undefined) {
      this.fileData['shortcuts'][this.indexMap[appId]] = undefined;
      this.indexMap[appId] = undefined;
    }
  }

  addItem(appId: string, value: VDF_ShortcutsItem) {
    if (this.valid && this.indexMap[appId] === undefined) {
      this.fileData['shortcuts'].push(value);
      this.indexMap[appId] = this.fileData['shortcuts'].length - 1;
    }
  }

  getAppIds() {
    return Object.keys(this.indexMap);
  }
}
