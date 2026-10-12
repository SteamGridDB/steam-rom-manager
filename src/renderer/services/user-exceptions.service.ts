import { Injectable } from "@angular/core";
import { UserExceptions, UserExceptionData, ParserType } from "../../models";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";

// User exceptions, owned by the ExceptionsStore in the main process; this
// mirrors the saved exceptions and adds the exceptions editor's unsaved copy
// (`current`) and its unsaved flag.
@Injectable()
export class UserExceptionsService {
  private variableData = new BehaviorSubject<{
    current: UserExceptions;
    saved: UserExceptions;
  }>({ current: null, saved: { titles: {} } });
  private isUnsavedData: BehaviorSubject<boolean> = new BehaviorSubject(false);
  sortBy: string = "timeStamp|desc";

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("exceptions:changed", (saved) =>
      this.variableData.next({ current: null, saved }),
    );
    client.whenLoaded("exceptions").then(() => this.refresh());
  }

  private callSync(method: string, ...args: any[]) {
    return this.coreClient.client.callSync("exceptions", method, ...args);
  }

  private refresh() {
    this.variableData.next({ current: null, saved: this.callSync("get") });
  }

  // Runs an edit in the main process; on success the saved data changed.
  private edit(method: string, ...args: any[]) {
    if (this.callSync(method, ...args)) {
      this.setIsUnsaved(false);
      this.refresh();
    }
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

  putBack(exceptionKey: string) {
    this.edit("putBack", exceptionKey);
  }

  makeExceptionId(
    executableLocation: string,
    extractedTitle: string,
    parserType: ParserType,
  ): string {
    return this.callSync(
      "makeExceptionId",
      executableLocation,
      extractedTitle,
      parserType,
    );
  }

  deleteExceptionById(exceptionId: string) {
    this.edit("deleteById", exceptionId);
  }

  addExceptionById(
    exceptionId: string,
    extractedTitle: string,
    newException: UserExceptionData,
  ) {
    this.edit("addById", exceptionId, extractedTitle, newException);
  }

  getExceptionById(exceptionId: string): UserExceptionData | undefined {
    const match = Object.keys(this.data.saved.titles).find((key) => {
      const m = key.match(/\$\{id\:([0-9]*?)\}/);
      return m && m[1] == exceptionId;
    });
    return match ? this.data.saved.titles[match] : undefined;
  }

  setSaved(data: UserExceptions) {
    const error = this.callSync("setSaved", data);
    if (!error) {
      this.refresh();
    }
    return error;
  }

  setCurrent(data: UserExceptions) {
    const error = data ? this.callSync("validate", data) : null;
    if (!error) {
      this.variableData.next({ current: data, saved: this.data.saved });
    }
    return error;
  }

  setIsUnsaved(isUnsaved: boolean) {
    this.isUnsavedData.next(isUnsaved);
  }

  saveUserExceptions() {
    this.edit("save", this.data.current);
  }
}
