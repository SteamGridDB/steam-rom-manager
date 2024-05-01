import { Injectable } from '@angular/core';
import { CustomVariables, xRequestOptions } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { APP } from '../../variables';
import { xRequest } from '../../lib/x-request';
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from '../schemas';
import * as _ from "lodash";
import path from 'path/posix';

@Injectable()
export class CustomVariablesService {
  private xRequest = new xRequest();
  private requestOpts: xRequestOptions = {
    responseType: 'json',
    method: 'GET',
    timeout: 5000
  }
  private variableData: BehaviorSubject<CustomVariables> = new BehaviorSubject({});

  private downloadStatus: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private validator: json.Validator = new json.Validator(schemas.customVariables);
  private savingIsDisabled: boolean = false;
  private treesURL: string = 'https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/';
  private rawURL: string = 'https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/master/';


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

  async download(force: boolean = false): Promise<void> {
    if(!this.downloadStatus.getValue()) {
      this.downloadStatus.next(true)
      const downloadURL = this.treesURL.concat('master').concat('?recursive=1')
      const treeData = await this.xRequest.request(downloadURL, this.requestOpts);
      let variableURLs = treeData.tree
      .filter((entry: any) => path.dirname(entry.path)=='files/customvariables')
      .map((entry: any)=> entry.path);
      let customVariables: any[] = [];
      for(let variableURL of variableURLs) {
        const cleanURL = variableURL.split('/').map((x:string)=>encodeURI(x)).join('/')
        const fullURL = this.rawURL.concat(cleanURL)
        const customVariable = await this.xRequest.request(fullURL, this.requestOpts)
        customVariables.push(customVariable)
      }
      let joinedVariables = Object.assign({}, ...customVariables)
      const error = this.set(joinedVariables)
      if (error){
        this.loggerService.error(this.lang.error.failedToDownload__i.interpolate({ error: error }));
      } else {
        this.loggerService.info(this.lang.info.downloaded, force ? { invokeAlert: true, alertTimeout: 5000 } : undefined);
        this.save(force);
      }
      this.downloadStatus.next(false);
    }
  }

  load() {
    return this.download().then(() => {
      return json.read<CustomVariables>(paths.customVariables)
    }).then((data) => {
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
