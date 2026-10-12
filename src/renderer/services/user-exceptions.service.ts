import { Injectable } from "@angular/core";
import { UserExceptions, UserExceptionData, ParserType } from "../../models";
import { LoggerService } from "./logger.service";
import { BehaviorSubject } from "rxjs";
import { ExceptionsStore } from "../../core/exceptions-store";

// Angular facade over the core ExceptionsStore, adding the exceptions
// editor's unsaved copy (`current`) and its unsaved flag.
@Injectable()
export class UserExceptionsService {
  readonly store: ExceptionsStore;
  private variableData = new BehaviorSubject<{
    current: UserExceptions;
    saved: UserExceptions;
  }>({ current: null, saved: { titles: {} } });
  private isUnsavedData: BehaviorSubject<boolean> = new BehaviorSubject(false);
  sortBy: string = "timeStamp|desc";

  constructor(private loggerService: LoggerService) {
    this.store = new ExceptionsStore(this.loggerService);
    this.store.onChange((saved) =>
      this.variableData.next({ current: null, saved }),
    );
    this.load();
  }

  get data(): { current: UserExceptions; saved: UserExceptions } {
    return this.variableData.getValue();
  }

  get dataObservable() {
    return this.variableData.asObservable();
  }

  get isUnsaved() {
    return this.isUnsavedData.getValue();
  }

  get isUnsavedObservable() {
    return this.isUnsavedData.asObservable();
  }

  load() {
    return this.store.load();
  }

  private afterSave(saved: boolean) {
    if (saved) {
      this.setIsUnsaved(false);
    }
  }

  putBack(exceptionKey: string) {
    this.afterSave(this.store.putBack(exceptionKey));
  }

  makeExceptionId(
    executableLocation: string,
    extractedTitle: string,
    parserType: ParserType,
  ) {
    return this.store.makeExceptionId(
      executableLocation,
      extractedTitle,
      parserType,
    );
  }

  deleteExceptionById(exceptionId: string) {
    this.afterSave(this.store.deleteById(exceptionId));
  }

  addExceptionById(
    exceptionId: string,
    extractedTitle: string,
    newException: UserExceptionData,
  ) {
    this.afterSave(
      this.store.addById(exceptionId, extractedTitle, newException),
    );
  }

  getExceptionById(exceptionId: string) {
    return this.store.getById(exceptionId);
  }

  setSaved(data: UserExceptions) {
    return this.store.setSaved(data);
  }

  setCurrent(data: UserExceptions) {
    const error = data ? this.store.validate(data) : null;
    if (!error) {
      this.variableData.next({ current: data, saved: this.data.saved });
    }
    return error;
  }

  setIsUnsaved(isUnsaved: boolean) {
    this.isUnsavedData.next(isUnsaved);
  }

  saveUserExceptions() {
    this.afterSave(this.store.save(this.data.current));
  }
}
