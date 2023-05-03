import { VDF_AddedItemsData } from "../models";
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as json from './helpers/json';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';

export class VDF_AddedItemsFile {
  private fileData: VDF_AddedItemsData = undefined;

  constructor(private filepath: string) { }

  get data() {
    return this.fileData;
  }

  set data(value: VDF_AddedItemsData) {
    this.fileData = value;
  }

  get valid() {
    return this.fileData !== undefined;
  }

  get invalid() {
    return !this.valid;
  }

  read() {
    return json.read<any>(this.filepath, {}).then((readData) => {
      if(Array.isArray(readData) || !readData.version) {
        this.fileData = { version: 1, addedApps: {} };
        for (let i = 0; i < readData.length; i++) {
          this.fileData.addedApps[readData[i].split('_')[0]] = {
            parserId: readData[i].split('_')[1],
            artworkOnly: (readData[i].split('_')[0].length < 17)
          }
        }
      } else if(readData.version == 1) {
        this.fileData = readData;
      }
      return this.data;
    }).catch((error) => {
      this.fileData = {addedApps: {}};
    });
  }

  write() {
    this.fileData.addedApps = _.pickBy(this.fileData.addedApps, item => item !== undefined);
    return json.write(this.filepath, this.fileData);
  }

  getItem(appId: string){
    return this.fileData.addedApps[appId];
  }

  removeItem(appId: string){
    if (this.fileData.addedApps[appId] !== undefined){
      this.fileData.addedApps[appId] = undefined;
    }
  }

  clear() {
    this.fileData.addedApps = {};
  }

  addItem(appId: string, parserId: string, artworkOnly: boolean) {
    this.fileData.addedApps[appId] = {parserId: parserId, artworkOnly: artworkOnly};
  }
}
