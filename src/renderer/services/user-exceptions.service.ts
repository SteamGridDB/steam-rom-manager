import { Injectable } from '@angular/core';
import { UserExceptions } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { APP } from '../../variables';
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from '../schemas';
import * as _ from "lodash";

@Injectable()
export class UserExceptionsService {
  private variableData: BehaviorSubject<UserExceptions> = new BehaviorSubject({});
  private validator: json.Validator = new json.Validator(schemas.userExceptions);
  private savingIsDisabled: boolean = false;

  constructor(private loggerService: LoggerService) {
    this.load();
  }

  private get lang() {
    return APP.lang.userExceptions.service;
  }

  get data() {
    return this.variableData.getValue();
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  load() {
    json.read<UserExceptions>(paths.userExceptions)
      .then((data) => {
        if(data !== null) {
          const error = this.set(data || {});
          if (error) {
            this.savingIsDisabled = true;
            this.loggerService.error(this.lang.error.loadingError, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
            this.loggerService.error(this.lang.error.corruptedExceptions__i.interpolate({
              file: paths.userExceptions,
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

  set(data: UserExceptions) {
    if (this.validator.validate(data).isValid()) {
      this.variableData.next(data);
      return null;
    }
    else {
      this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
      this.loggerService.error(this.validator.errorString);
      return `\r\n${this.validator.errorString}`;
    }

  }

  saveUserExceptions() {
    if (!this.savingIsDisabled) {
      json.write(paths.userExceptions, this.variableData.getValue()).then().catch((error) => {
        this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
        this.loggerService.error(error);
      });
    }
  }
}
