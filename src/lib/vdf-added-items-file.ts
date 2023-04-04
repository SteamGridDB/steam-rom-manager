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
    return json.read<string[]>(this.filepath, []).then((data) => {
      this.fileData = {};
      for (let i = 0; i < data.length; i++) {
        if(data[i].includes("_")) {
          this.fileData[data[i].split('_')[0]] = data[i].split('_')[1]; //fileData[data[i]] was just set to true
        } else {
          this.fileData[data[i]] = '-legacy-';
        }
      }
      return this.data;
    });
  }

  write() {
    this.fileData = _.pickBy(this.fileData, item => item !== undefined);
    let app_ids = Object.keys(this.fileData).filter((app_id:string) => this.fileData[app_id]!=='-legacy-');
    let data = app_ids.map((app_id:string)=>app_id.concat('_',this.fileData[app_id])) //data was just keys
    return json.write(this.filepath, data);
  }

  getItem(appId: string){
    return this.fileData[appId];
  }

  removeItem(appId: string){
    if (this.fileData[appId] !== undefined){
      this.fileData[appId] = undefined;
    }
  }

  addItem(appId: string, parserId: string) {
    this.fileData[appId] = parserId;
  }
}
