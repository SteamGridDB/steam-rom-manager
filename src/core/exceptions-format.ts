// userExceptions.json's rules (see models/user-exceptions.model.ts): finding
// the rule for a game, and converting from/to the pre-version-3 format.
// Pure: also used by the UI.
import {
  GameException,
  GameExclusion,
  GameMatch,
  LegacyExceptionData,
  LegacyExceptionsTitles,
  UserExceptions,
} from "../models";

export const legacyAppIdKey = /^(.*?) ?\$\{id:([0-9]*)\}$/;
const legacySgdbId = /^\$\{gameid:([0-9]*)\}$/;

export function newRuleId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyExceptions(): UserExceptions {
  return { exceptionsVersion: 3, exceptions: [], exclusions: [] };
}

// The game a rule is about, as shown to users.
export function ruleTitle(rule: GameMatch) {
  return rule.matchAppId !== undefined
    ? (rule.appTitle ?? "")
    : (rule.matchTitle ?? "");
}

// Identifies what a rule matches (two rules with the same key conflict).
export function matchKey(rule: GameMatch) {
  return rule.matchAppId !== undefined
    ? `appId:${rule.matchAppId}`
    : `title:${rule.matchTitle ?? ""}`;
}

// The rule for a game: one made for its app id wins over one for its title.
export function ruleFor<T extends GameMatch>(
  rules: T[],
  appId: string,
  extractedTitle: string,
): T | undefined {
  return (
    rules.find((r) => r.matchAppId !== undefined && r.matchAppId === appId) ??
    rules.find(
      (r) => r.matchAppId === undefined && r.matchTitle === extractedTitle,
    )
  );
}

// What the artwork providers search for: a SteamGridDB id picked with "Fix
// match", else the search title ("" = the game's title).
export function searchQuery(exception: GameException) {
  return exception.sgdbId
    ? `\${gameid:${exception.sgdbId}}`
    : exception.searchTitle;
}

// Whether an exception changes anything.
export function hasChanges(e: Partial<GameException>) {
  return !!(
    e.newTitle ||
    e.searchTitle ||
    e.sgdbId ||
    e.commandLineArguments ||
    e.excludeArtwork ||
    e.compatToolName !== undefined
  );
}

// Rules that match the same game more than once.
export function duplicateMatches(data: UserExceptions) {
  const duplicates = (rules: GameMatch[]) =>
    rules.map(matchKey).filter((key, i, keys) => keys.indexOf(key) !== i);
  return [
    ...new Set([
      ...duplicates(data.exceptions),
      ...duplicates(data.exclusions),
    ]),
  ];
}

// Pre-version-3 entries -> rules. An excluded entry with changes becomes both
// an exclusion and an exception (the changes apply again once put back).
export function fromLegacy(titles: LegacyExceptionsTitles = {}): {
  exceptions: GameException[];
  exclusions: GameExclusion[];
} {
  const exceptions: GameException[] = [];
  const exclusions: GameExclusion[] = [];
  for (const [key, entry] of Object.entries(titles)) {
    const byId = key.match(legacyAppIdKey);
    const match: GameMatch = byId
      ? { matchAppId: byId[2], appTitle: byId[1] }
      : { matchTitle: key };
    const timeStamp = entry.timeStamp || 0;
    if (entry.exclude) {
      exclusions.push({ id: newRuleId(), ...match, timeStamp });
    }
    const sgdb = (entry.searchTitle || "").match(legacySgdbId);
    const exception: GameException = {
      id: newRuleId(),
      ...match,
      timeStamp,
      newTitle: entry.newTitle || "",
      searchTitle: sgdb ? "" : entry.searchTitle || "",
      sgdbId: sgdb ? sgdb[1] : "",
      commandLineArguments: entry.commandLineArguments || "",
      excludeArtwork: !!entry.excludeArtwork,
      compatToolName: entry.compatToolName,
    };
    if (exception.compatToolName === undefined) {
      delete exception.compatToolName;
    }
    if (hasChanges(exception)) {
      exceptions.push(exception);
    }
  }
  return { exceptions, exclusions };
}

// Rules -> pre-version-3 entries, so an older SRM can still use the file.
export function toLegacy(data: UserExceptions): LegacyExceptionsTitles {
  const titles: LegacyExceptionsTitles = {};
  const keyOf = (rule: GameMatch) =>
    rule.matchAppId !== undefined
      ? `${rule.appTitle ?? ""} \${id:${rule.matchAppId}}`
      : (rule.matchTitle ?? "");
  const entry = (key: string): LegacyExceptionData =>
    (titles[key] ??= {
      newTitle: "",
      searchTitle: "",
      timeStamp: 0,
      commandLineArguments: "",
      exclude: false,
      excludeArtwork: false,
    });
  for (const e of data.exceptions) {
    const legacy = entry(keyOf(e));
    Object.assign(legacy, {
      newTitle: e.newTitle,
      searchTitle: searchQuery(e),
      timeStamp: e.timeStamp,
      commandLineArguments: e.commandLineArguments,
      excludeArtwork: e.excludeArtwork,
    });
    if (e.compatToolName !== undefined) {
      legacy.compatToolName = e.compatToolName;
    }
  }
  for (const x of data.exclusions) {
    const legacy = entry(keyOf(x));
    legacy.exclude = true;
    legacy.timeStamp = Math.max(legacy.timeStamp, x.timeStamp);
  }
  return titles;
}
