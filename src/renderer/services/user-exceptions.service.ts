import { Injectable } from "@angular/core";
import { GameException, ParserType, UserExceptions } from "../../models";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "./core-client.service";
import { emptyExceptions, ruleFor } from "../../core/exceptions-format";
import type { ExceptionChanges } from "../../core/exceptions-store";

// User exceptions and exclusions, owned by the ExceptionsStore in the main
// process: a mirror of the saved rules, plus whether the exceptions page has
// unsaved edits (shown in the navigation).
@Injectable()
export class UserExceptionsService {
  private saved = new BehaviorSubject<UserExceptions>(emptyExceptions());
  private isUnsavedData = new BehaviorSubject<boolean>(false);

  constructor(private coreClient: CoreClientService) {
    const client = this.coreClient.client;
    client.on("exceptions:changed", (saved) => this.saved.next(saved));
    client.whenLoaded("exceptions").then(() => this.refresh());
  }

  private callSync(method: string, ...args: any[]) {
    return this.coreClient.client.callSync("exceptions", method, ...args);
  }

  private refresh() {
    this.saved.next(this.callSync("get"));
    this.coreClient.client.markFresh("exceptions:changed");
  }

  // Runs an edit in the main process; returns whether it was saved.
  private edit(method: string, ...args: any[]): boolean {
    const ok = !!this.callSync(method, ...args);
    if (ok) this.refresh();
    return ok;
  }

  get data(): UserExceptions {
    return this.saved.getValue();
  }

  get dataObservable() {
    return this.saved.asObservable();
  }

  get isUnsaved() {
    return this.isUnsavedData.getValue();
  }

  get isUnsavedObservable() {
    return this.isUnsavedData.asObservable();
  }

  setIsUnsaved(isUnsaved: boolean) {
    this.isUnsavedData.next(isUnsaved);
  }

  // The id rules made on the Add Games page match a game by.
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

  // The exception that applies to a game (by app id, else by title).
  exceptionFor(appId: string, extractedTitle: string): GameException {
    return ruleFor(this.data.exceptions, appId, extractedTitle);
  }

  // Sets (or with no changes, removes) a game's exception from Add Games.
  setGameException(appId: string, appTitle: string, changes: ExceptionChanges) {
    return this.edit("setGameException", appId, appTitle, changes);
  }

  deleteGameException(appId: string) {
    return this.edit("deleteGameException", appId);
  }

  exclude(games: { appId: string; appTitle: string }[]) {
    return this.edit("exclude", games);
  }

  removeExclusions(ids: string[]) {
    return this.edit("removeExclusions", ids);
  }

  // Validates rules edited on the exceptions page: null, or the problem.
  validate(data: UserExceptions): string | null {
    return this.callSync("validate", structuredClone(data));
  }

  // Saves the exceptions page's rules.
  save(data: UserExceptions) {
    return this.edit("save", data);
  }
}
