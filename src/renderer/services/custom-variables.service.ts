import { Injectable } from '@angular/core';
import { CustomVariables } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { APP } from '../../variables';
import { xRequest } from '../../lib/x-request';
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from '../schemas';
import * as _ from "lodash";

@Injectable()
export class CustomVariablesService {
  private static xRequest = new xRequest();
  private variableData: BehaviorSubject<CustomVariables> = new BehaviorSubject({});

  private downloadStatus: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private validator: json.Validator = new json.Validator(schemas.customVariables);
  private savingIsDisabled: boolean = false;

  constructor(private loggerService: LoggerService) {
    this.load();
  }

  private get lang() {
    return APP.lang.customVariables.service;
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

        return CustomVariablesService.xRequest.request(
          'https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/master/files/customVariables.json',
          {
            responseType: 'json',
            method: 'GET',
            timeout: 5000
          }
        ).then((data) => {
          const error = this.set(data || {});
          if (error !== null) {
            throw new Error(error);
          }
          else {
            this.loggerService.info(this.lang.info.downloaded, force ? { invokeAlert: true, alertTimeout: 5000 } : undefined);
            this.save(force);
          }
        }).catch((error) => {
          this.loggerService.error(this.lang.error.failedToDownload__i.interpolate({ error: _.get(error, 'error.status', error) }));
        }).finally(() => {
          this.downloadStatus.next(false);
        })
      }
    });
  }

  load() {
    json.read<CustomVariables>(paths.customVariables)
      .then((data) => {
        if (data === null) {
          return this.download();
        }
        else {
          const error = this.set(data || {});
          if (error !== null) {
            this.savingIsDisabled = true;
            this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
            this.loggerService.error(this.lang.error.corruptedVariables__i.interpolate({
              file: paths.customVariables,
              error
            }));
          }
        }
      })
      .catch((error) => {
        this.savingIsDisabled = true;
        this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
        this.loggerService.error(error);
      });
  }

  set(data: CustomVariables) {
    if (this.validator.validate(data).isValid()) {
      this.variableData.next(data);
      return null;
    }
    else
      return `\r\n${this.validator.errorString}`;
  }

  save(force: boolean = false) {
    if (!this.savingIsDisabled || force) {
      json.write(paths.customVariables, this.variableData.getValue()).then().catch((error) => {
        this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      });
    }
  }
}
