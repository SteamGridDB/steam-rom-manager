import {
  GameException,
  GameMatch,
  Logger,
  ParserType,
  UserExceptions,
} from "../models";
import { APP } from "../variables";
import * as json from "../lib/helpers/json";
import * as paths from "../paths";
import * as schemas from "./schemas";
import * as modifiers from "./modifiers";
import { superTypesMap } from "../lib/parsers/available-parsers";
import { generateShortAppId } from "../lib/helpers/steam/generate-app-id";
import {
  duplicateMatches,
  emptyExceptions,
  hasChanges,
  matchKey,
  newRuleId,
  ruleFor,
  toLegacy,
} from "./exceptions-format";

type Listener = (saved: UserExceptions) => void;

// The changes a game's exception can make (everything but which game).
export type ExceptionChanges = Omit<
  GameException,
  "id" | "timeStamp" | "matchAppId" | "matchTitle" | "appTitle"
>;

// userExceptions.json: per-game exclusions and changes (see
// models/user-exceptions.model.ts).
export class ExceptionsStore {
  private saved: UserExceptions = emptyExceptions();
  private listeners = new Set<Listener>();
  private validator = new json.Validator(
    schemas.userExceptions,
    modifiers.userExceptions,
  );
  savingIsDisabled = false;

  constructor(private logger: Logger) {}

  private get lang() {
    return APP.lang.userExceptions.service;
  }

  get(): UserExceptions {
    return this.saved;
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed() {
    for (const listener of this.listeners) {
      listener(this.saved);
    }
  }

  async load(): Promise<UserExceptions> {
    try {
      const data = await json.read<UserExceptions>(paths.userExceptions);
      if (data !== null) {
        const error = this.setSaved(data);
        if (error) {
          this.savingIsDisabled = true;
          this.logger.error(this.lang.error.loadingError, {
            invokeAlert: true,
            alertTimeout: 5000,
            doNotAppendToLog: true,
          });
          this.logger.error(
            this.lang.error.corruptedExceptions__i.interpolate({
              file: paths.userExceptions,
              error,
            }),
          );
        }
      }
    } catch (error) {
      this.savingIsDisabled = true;
      this.logger.error(this.lang.error.loadingError, {
        invokeAlert: true,
        alertTimeout: 5000,
        doNotAppendToLog: true,
      });
      this.logger.error(error);
    }
    return this.saved;
  }

  // Validates (and migrates) `data` in place; returns an error string if
  // invalid. Every rule must match by exactly one of app id or title, and
  // at most one rule of each kind per game.
  validate(data: UserExceptions): string | null {
    // Rules in the current shape (e.g. from the UI) need no migration; the
    // first migration step would read them as a very old file.
    if (
      data &&
      data.exceptionsVersion === undefined &&
      Array.isArray(data.exceptions)
    ) {
      data.exceptionsVersion = modifiers.userExceptions.latestVersion as number;
    }
    if (!data || !this.validator.validate(data).isValid()) {
      this.logger.error(this.lang.error.writingError, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(this.validator.errorString);
      return `\r\n${this.validator.errorString}`;
    }
    const unmatched = [...data.exceptions, ...data.exclusions].filter(
      (rule) =>
        (rule.matchAppId === undefined) === (rule.matchTitle === undefined),
    );
    if (unmatched.length) {
      return `Rules must match by app id or by title: ${unmatched.map((r) => r.id).join(", ")}`;
    }
    const duplicates = duplicateMatches(data);
    if (duplicates.length) {
      this.logger.error(this.lang.error.duplicates, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(
        this.lang.error.duplicates__i.interpolate({
          rules: duplicates.join(", "),
        }),
      );
      return `Duplicate rules: ${duplicates.join(", ")}`;
    }
    return null;
  }

  // Replaces the saved exceptions in memory (not on disk) if valid.
  setSaved(data: UserExceptions): string | null {
    const error = this.validate(data);
    if (!error) {
      delete data.titles;
      this.saved = data;
      this.changed();
    }
    return error;
  }

  // Writes `data` as the new saved exceptions. Returns false (and changes
  // nothing) if saving is disabled or `data` is invalid.
  save(data: UserExceptions): boolean {
    if (this.savingIsDisabled || !data || this.validate(data)) {
      return false;
    }
    delete data.titles;
    json
      .write(paths.userExceptions, { ...data, titles: toLegacy(data) })
      .catch((error) => {
        this.logger.error(this.lang.error.writingError, {
          invokeAlert: true,
          alertTimeout: 3000,
        });
        this.logger.error(error);
      });
    this.saved = data;
    this.changed();
    return true;
  }

  // The id rules made on the Add Games page match a game by: its short app
  // id, or for artwork-only parsers the Steam app id (the "executable").
  makeExceptionId(
    executableLocation: string,
    extractedTitle: string,
    parserType: ParserType,
  ) {
    if (superTypesMap[parserType] == "ArtworkOnly") {
      return executableLocation.replace(/\"/g, "");
    }
    return generateShortAppId(executableLocation, extractedTitle);
  }

  // The exception that applies to a game (one made for it from Add Games, or
  // one for its title).
  exceptionFor(appId: string, extractedTitle: string) {
    return ruleFor(this.saved.exceptions, appId, extractedTitle);
  }

  // Sets the changes for a game from the Add Games page (by app id); no
  // changes removes its exception. Its exclusion, if any, is untouched.
  setGameException(
    appId: string,
    appTitle: string,
    changes: ExceptionChanges,
  ): boolean {
    const data = this.copy();
    const existing = data.exceptions.findIndex((e) => e.matchAppId === appId);
    const exception: GameException = {
      ...changes,
      id: existing >= 0 ? data.exceptions[existing].id : newRuleId(),
      matchAppId: appId,
      appTitle,
      timeStamp: Date.now(),
    };
    if (exception.compatToolName === undefined) {
      delete exception.compatToolName;
    }
    if (existing >= 0) data.exceptions.splice(existing, 1);
    if (hasChanges(exception)) data.exceptions.push(exception);
    return this.save(data);
  }

  deleteGameException(appId: string): boolean {
    const data = this.copy();
    data.exceptions = data.exceptions.filter((e) => e.matchAppId !== appId);
    return this.save(data);
  }

  // Excludes games (from Add Games, by app id); already excluded ones stay
  // as they are. Their exceptions are kept for when they're put back.
  exclude(games: { appId: string; appTitle: string }[]): boolean {
    const data = this.copy();
    const taken = new Set(data.exclusions.map(matchKey));
    for (const { appId, appTitle } of games) {
      const rule: GameMatch = { matchAppId: appId, appTitle };
      if (!taken.has(matchKey(rule))) {
        taken.add(matchKey(rule));
        data.exclusions.push({
          id: newRuleId(),
          ...rule,
          timeStamp: Date.now(),
        });
      }
    }
    return this.save(data);
  }

  // Puts excluded games back.
  removeExclusions(ids: string[]): boolean {
    const data = this.copy();
    data.exclusions = data.exclusions.filter((x) => !ids.includes(x.id));
    return this.save(data);
  }

  private copy(): UserExceptions {
    return structuredClone(this.saved);
  }
}
