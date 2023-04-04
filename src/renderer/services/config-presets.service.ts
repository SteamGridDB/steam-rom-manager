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
    return Promise.resolve().then(() => {
      if (!this.downloadStatus.getValue()) {
        this.downloadStatus.next(true);
        return ConfigurationPresetsService.xRequest.request(
          'https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/master?recursive=1',
          { responseType: 'json', method: 'GET', timeout: 1000 }
        ).then((data: any)=>{
          let presetURLs = data.tree
          .filter((entry: any)=>path.dirname(entry.path)=='files/presets')
          .map((entry: any)=>entry.path)

          let presetPromises: PromiseLike<any>[] = []
          presetURLs.forEach((url: string)=>{
            let queryURL = this.rawURL.concat(url);
            presetPromises.push(ConfigurationPresetsService.xRequest.request(queryURL, {
              responseType: 'json',
              method: 'GET',
              timeout: 1000
            }));
          })
          return Promise.all(presetPromises)
        }).then((data)=>{
          let result = Object.assign({},...data);
          const error = this.set(result || {});
          if (error) {
            throw new Error(error);
          }
          this.loggerService.info(this.lang.info.downloaded, force ? { invokeAlert: true, alertTimeout: 5000 } : undefined);
          this.save(force);
        }).catch((error) => {
          this.loggerService.error(this.lang.error.failedToDownload__i.interpolate({ error: _.get(error, 'error.status', error) }));
        }).finally(() => {
          this.downloadStatus.next(false);
        });
      }
    });
  }

  load() {
    ConfigurationPresetsService.xRequest.request(this.rawURL.concat('files/presetsData.json'), {
      responseType: 'json', method: 'GET', timeout: 1000
    }).then((presetsData)=>{
      let localVersion = fs.existsSync(paths.presetsData) ? fs.readJsonSync(paths.presetsData).version : 0;
      let remoteVersion = presetsData.version;
      if(localVersion < remoteVersion) {
        this.loggerService.info(this.lang.info.updatingPresets);
        return this.download().then(()=>json.write(paths.presetsData, presetsData));
      } else {
        return json.read<ConfigPresets>(paths.configPresets).then((data) => {
          if (data === null) {
            return this.download();
          }
          else {
            const error = this.set(data || {});
            if (error !== null) {
              this.savingIsDisabled = true;
              this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });

              this.loggerService.error(this.lang.error.corruptedVariables__i.interpolate({
                file: paths.configPresets,
                error
              }));
            }
          }
        })
      }
    }).catch((error) => {
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
      json.write(paths.configPresets, this.variableData.getValue()).then().catch((error) => {
        this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      });
    }
  }
}
