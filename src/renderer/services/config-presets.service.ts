import { Injectable } from '@angular/core';
import { ConfigPresets } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { APP } from '../../variables';
import { xRequest } from '../../lib/x-request';
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from '../schemas';
import * as _ from "lodash";
import * as path from "path"
import * as fs from "fs-extra";

@Injectable()
export class ConfigurationPresetsService {
  private static xRequest = new xRequest();
  private variableData: BehaviorSubject<ConfigPresets> = new BehaviorSubject({});
  private downloadStatus: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private validator: json.Validator = new json.Validator(schemas.configPresets);
  private savingIsDisabled: boolean = false;
  private rawURL: string = 'https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/master/';
  private treesURL: string = 'https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/';

  constructor(private loggerService: LoggerService) {
    this.load();
  }

  private get lang() {
    return APP.lang.configPresets.service;
  }

  get data() {
    return this.variableData.getValue();
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  get isDownloading() {
    return this.downloadStatus;
  }

  download(force: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      if(this.downloadStatus.getValue()) {
        resolve();
      } else {
        this.downloadStatus.next(true);
        ConfigurationPresetsService.xRequest.request(this.rawURL.concat('files/presetsHashes.json'), {
          responseType: 'json', method: 'GET', timeout: 5000
        })
        .then((presetsHashes) => {
          const appVersion: string = APP.version || '';
          let downloadURL: string;
          // change this to work as a version range
          if(presetsHashes && presetsHashes[appVersion]) {
            const commit = presetsHashes[appVersion].commit;
            downloadURL = this.treesURL.concat(commit).concat('?recursive=1')
          } else {
            downloadURL = this.treesURL.concat('master').concat('?recursive=1')
          }
          return downloadURL;
        })
        .then((downloadURL) => {
          return ConfigurationPresetsService.xRequest.request(downloadURL, {
            responseType: 'json', method: 'GET', timeout: 5000
          })
        })
        .then((treedata: any)=>{
          let presetURLs = treedata.tree
          .filter((entry: any)=>path.dirname(entry.path)=='files/presets')
          .map((entry: any)=>entry.path)

          let presetPromises: PromiseLike<any>[] = []
          presetURLs.forEach((url: string)=>{
            let queryURL = this.rawURL.concat(url);
            presetPromises.push(ConfigurationPresetsService.xRequest.request(queryURL, {
              responseType: 'json',
              method: 'GET',
              timeout: 5000
            }));
          })
          return Promise.all(presetPromises)
        })
        .then((presets)=>{
          let joinedPresets = Object.assign({}, ...presets);
          const error = this.set(joinedPresets);
          if (error) {
            throw new Error(error);
          }
          this.loggerService.info(this.lang.info.downloaded, force ? { invokeAlert: true, alertTimeout: 5000 } : undefined);
          return this.save(force);
        })
        .catch((error) => {
          this.loggerService.error(this.lang.error.failedToDownload__i.interpolate({ error: _.get(error, 'error.status', error) }));
        })
        .finally(() => {
          this.downloadStatus.next(false);
          resolve();
        });
      }
    })
  }

  load() {
    return this.download().then(() => {
      return json.read<ConfigPresets>(paths.configPresets)
    })
    .then((data) => {
      const error = this.set(data || {});
      if (error !== null) {
        this.savingIsDisabled = true;
        this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
        this.loggerService.error(this.lang.error.corruptedVariables__i.interpolate({
          file: paths.configPresets,
          error
        }));
      }
    })
    .catch((error) => {
      this.savingIsDisabled = true;
      this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
      this.loggerService.error(error);
    });
  }

  set(data: ConfigPresets) {
    if (this.validator.validate(data).isValid()) {
      this.variableData.next(data);
      return null;
    }
    else
      return `\r\n${this.validator.errorString}`;
  }

  save(force: boolean = false) {
    if (!this.savingIsDisabled || force) {
      return json.write(paths.configPresets, this.variableData.getValue()).then().catch((error) => {
        this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      });
    }
  }
}
