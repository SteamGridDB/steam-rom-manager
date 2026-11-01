// userExceptions.json (exceptionsVersion 3): two lists of per-game rules.
// - exclusions: games left out of the app list entirely.
// - exceptions: changes to a game (title, artwork search, launch arguments,
//   compat tool, ...).
// A rule applies to one game, matched either by SRM's app id (rules made on
// the Add Games page) or by the extracted title (rules added by hand).

export interface GameMatch {
  // Added by hand: every game whose extracted title is this.
  matchTitle?: string;
  // Added from the Add Games page: that one game, by its short app id (for
  // artwork-only parsers: the Steam app id). Never edited.
  matchAppId?: string;
  // matchAppId's game title when the rule was made (shown, not matched).
  appTitle?: string;
}

export interface GameExclusion extends GameMatch {
  id: string;
  timeStamp: number;
}

export interface GameException extends GameMatch {
  id: string;
  timeStamp: number;
  // Title in Steam ("" = keep).
  newTitle: string;
  // Artwork search for this game ("" = its title). sgdbId (picked with
  // "Fix match") takes precedence.
  searchTitle: string;
  sgdbId: string;
  commandLineArguments: string;
  // Only local artwork; no online search.
  excludeArtwork: boolean;
  // Per-game override of the parser's forced Steam Play compat tool.
  // undefined = inherit the parser default; "__none__" = opt this game out
  // (force no tool); any other string = force that specific tool name.
  compatToolName?: string;
}

export interface UserExceptions {
  exceptionsVersion?: number;
  exceptions: GameException[];
  exclusions: GameExclusion[];
  // The pre-version-3 format, written alongside so older SRM versions keep
  // working with the file (see core/exceptions-format.ts). Never read once
  // migrated.
  titles?: LegacyExceptionsTitles;
}

// Pre-version-3: one entry per key, the key being either an extracted title
// or "<title> ${id:<appId>}"; Fix Match stored "${gameid:<id>}" as
// searchTitle; `exclude` marked exclusions.
export interface LegacyExceptionData {
  newTitle: string;
  searchTitle: string;
  timeStamp: number;
  commandLineArguments: string;
  exclude: boolean;
  excludeArtwork: boolean;
  compatToolName?: string;
}
export interface LegacyExceptionsTitles {
  [key: string]: LegacyExceptionData;
}
