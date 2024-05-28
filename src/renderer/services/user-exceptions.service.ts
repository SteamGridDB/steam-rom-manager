import { Injectable } from '@angular/core';
import { UserExceptions, UserExceptionData, PreviewDataApp, ParserType } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { APP } from '../../variables';
import * as json from "../../lib/helpers/json";
import * as paths from "../../paths";
import * as schemas from '../schemas';
import * as modifiers from '../modifiers';
import * as _ from "lodash";
import { superTypesMap } from '../../lib/parsers/available-parsers';
import * as steam from '../../lib/helpers/steam';

@Injectable()
export class UserExceptionsService {
  private variableData: BehaviorSubject<{current: UserExceptions, saved: UserExceptions}>;
  private isUnsavedData: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private static appIdRegex: RegExp = /\$\{id\:([0-9]*?)\}/;

  private validator: json.Validator = new json.Validator(schemas.userExceptions, modifiers.userExceptions);
  private savingIsDisabled: boolean = false;
  sortBy: string = 'dateAdded|asc';

  constructor(private loggerService: LoggerService) {
    this.variableData = new BehaviorSubject({current: null, saved: {titles: {}}});
    this.load();
  }

  private get lang() {
    return APP.lang.userExceptions.service;
  }

  get data(): {current: UserExceptions, saved: UserExceptions} {
    return this.variableData.getValue() as {current: UserExceptions, saved: UserExceptions};
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  get isUnsaved() {
    return this.isUnsavedData.getValue()
  }

  get isUnsavedObservable() {
    return this.isUnsavedData.asObservable();
  }

  load() {
    json.read<UserExceptions>(paths.userExceptions)
      .then((data) => {
        if(data !== null) {
          const error = this.setSaved(data);
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

  putBack(exceptionKey: string) {
    const newData = this.data.saved;
    const currentEntry = newData.titles[exceptionKey] 
    if(currentEntry) {
      if(currentEntry.commandLineArguments||currentEntry.newTitle||currentEntry.searchTitle||currentEntry.excludeArtwork) {
        newData.titles[exceptionKey].exclude = false;
      } else {
        delete newData.titles[exceptionKey]
      }
    }
    this.variableData.next({current: newData, saved: this.data.saved})
    this.saveUserExceptions();
  }

  makeExceptionId(executableLocation: string, extractedTitle: string, parserType: ParserType) {
    if(superTypesMap[parserType]=='ArtworkOnly') {
      return executableLocation.replace(/\"/g,"");
    } else {
      return steam.generateShortAppId(executableLocation, extractedTitle)
    }
  }

  deleteExceptionById(exceptionId: string) {
    let newData = this.data.saved;
    const exceptionMatches = Object.keys(newData.titles).filter((exTitle: string) => {
      if(UserExceptionsService.appIdRegex.test(exTitle)) {
        return exTitle.match(UserExceptionsService.appIdRegex)[1] == exceptionId;
      } else {
        return false
      }
    })
    if(exceptionMatches.length) {
      delete newData.titles[exceptionMatches[0]];
    }
    this.variableData.next({current: newData, saved: this.data.saved});
    this.saveUserExceptions();
  }

  addExceptionById(exceptionId: string, extractedTitle: string, newException: UserExceptionData) {
    let newData = this.data.saved;
    const exceptionMatches = Object.keys(newData.titles).filter((exTitle: string) => {
      if(UserExceptionsService.appIdRegex.test(exTitle)) {
        return exTitle.match(UserExceptionsService.appIdRegex)[1] == exceptionId;
      } else {
        return false
      }
    })

    const replaceKey = exceptionMatches.length ? exceptionMatches[0] : `${extractedTitle} \$\{id:${exceptionId}\}`;
    newData.titles[replaceKey] = newException;
    this.variableData.next({current: newData, saved: this.data.saved})
    this.saveUserExceptions();
  }

  getExceptionById(exceptionId: string) {
    const exceptionMatches = Object.keys(this.data.saved.titles).filter((exTitle: string) => {
      if(UserExceptionsService.appIdRegex.test(exTitle)) {
        return exTitle.match(UserExceptionsService.appIdRegex)[1] == exceptionId;
      } else {
        return false
      }
    })
    if(exceptionMatches.length) {
      return this.data.saved.titles[exceptionMatches[0]]
    }
  }

  private duplicateKeys(data: UserExceptions) {
    const replacedKeys = Object.keys(data.titles).map(exTitle => {
      return UserExceptionsService.appIdRegex.test(exTitle) ? exTitle.match(UserExceptionsService.appIdRegex)[0] : exTitle
    })
    return _.keys(_.pickBy(_.groupBy(replacedKeys), x => x.length > 1))
    
  }

  setSaved(data: UserExceptions) {
    if (this.validator.validate(data).isValid() && data) {
      this.variableData.next({current: null, saved: data});
      return null;
    } else {
      this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
      this.loggerService.error(this.validator.errorString);
      return `\r\n${this.validator.errorString}`;
    }
  }

  setCurrent(data: UserExceptions) {
    if (!data || this.validator.validate(data).isValid()) {
      this.variableData.next({current: data, saved: this.variableData.getValue().saved});
      return null;
    }
    else {
      this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
      this.loggerService.error(this.validator.errorString);
      return `\r\n${this.validator.errorString}`;
    }
  }

  setIsUnsaved(isUnsaved: boolean) {
    this.isUnsavedData.next(isUnsaved);
  }

  saveUserExceptions() {
    let current = this.variableData.getValue().current;
    if (!this.savingIsDisabled && current) {
      const duplicates = this.duplicateKeys(current)
      if(duplicates.length) {
        this.loggerService.error('Cannot save duplicate exceptions, see log', { invokeAlert: true, alertTimeout: 3000})
        this.loggerService.error(`Duplicate Exception Keys: ${duplicates.join(', ')}`)
        return
      }
      json.write(paths.userExceptions, current)
        .then(()=>{

        }).catch((error) => {
          this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
          this.loggerService.error(error);
        });
      this.setIsUnsaved(false);
      this.variableData.next({current: null, saved: current});
    }
  }
}
