// Parse results kept per parser between Add Games refreshes, so a refresh
// only re-parses what changed:
// - a parser whose settings (or the global inputs: environment variables,
//   custom variables) changed, or that wasn't parsed before, is parsed;
// - a disabled parser's games simply aren't in the list;
// - an unchanged parser reuses its result, with exclusions added since
//   applied to it (excluding games needs no parse, nor does putting back
//   one excluded since). A parser is parsed again when a game excluded
//   while it was parsed is put back, or when a changed exception (rename,
//   Fix match, arguments...) matches one of its games.
// A refresh where nothing changed parses everything again: that's how new
// or removed files are picked up.
import * as _ from "lodash";
import {
  ParsedUserConfiguration,
  ParsedUserConfigurationFile,
  UserExceptions,
} from "../models";
import { ruleFor, ruleTitle } from "./exceptions-format";
import * as steam from "../lib/helpers/steam";
import * as parserInfo from "../lib/parsers/available-parsers";

// The id exception rules match a game by (as FileParser's exceptions step
// computes it: artwork-only parsers use the Steam app id).
export function gameMatchId(
  parserType: ParsedUserConfiguration["parserType"],
  file: ParsedUserConfigurationFile,
) {
  return parserInfo.superTypesMap[parserType] === parserInfo.ArtworkOnlyType
    ? file.modifiedExecutableLocation.replace(/\"/g, "")
    : steam.generateShortAppId(
        file.modifiedExecutableLocation,
        file.titles.extracted,
      );
}

interface Entry {
  // The parser's settings and the global inputs it was parsed with.
  key: string;
  parsed: ParsedUserConfiguration;
  // The exceptions it was parsed with.
  exceptions: UserExceptions;
}

// Rules (exclusions or exceptions) that differ between two lists: added,
// removed or edited (old and new versions both).
function changedRules<T extends { id: string }>(before: T[], after: T[]) {
  const byId = (rules: T[]) =>
    new Map(rules.map((r) => [r.id, JSON.stringify(r)]));
  const a = byId(before);
  const b = byId(after);
  return [
    ...before.filter((r) => b.get(r.id) !== a.get(r.id)),
    ...after.filter((r) => a.get(r.id) !== b.get(r.id)),
  ];
}

export class ParseCache {
  private entries = new Map<string, Entry>();
  // The last run: its parsers (in order) and exceptions.
  private lastRun = "";

  // Which parsers need parsing; the others' results, ready to use (copies,
  // with the current exclusions applied).
  plan(
    configs: { parserId: string; key: string }[],
    exceptions: UserExceptions,
  ): { parse: string[]; reuse: Map<string, ParsedUserConfiguration> } {
    const run = JSON.stringify([configs, exceptions]);
    const nothingChanged = run === this.lastRun;
    this.lastRun = run;
    const parse: string[] = [];
    const reuse = new Map<string, ParsedUserConfiguration>();
    for (const { parserId, key } of configs) {
      const entry = this.entries.get(parserId);
      if (
        nothingChanged ||
        !entry ||
        entry.key !== key ||
        this.affectedByExceptions(entry, exceptions)
      ) {
        parse.push(parserId);
      } else {
        reuse.set(parserId, this.withExclusions(entry.parsed, exceptions));
      }
    }
    return { parse, reuse };
  }

  // A parser's fresh result (as parsed with these exceptions).
  store(
    parserId: string,
    key: string,
    parsed: ParsedUserConfiguration,
    exceptions: UserExceptions,
  ) {
    this.entries.set(parserId, {
      key,
      parsed: _.cloneDeep(parsed),
      exceptions: _.cloneDeep(exceptions),
    });
  }

  clear() {
    this.entries.clear();
    this.lastRun = "";
  }

  private affectedByExceptions(entry: Entry, current: UserExceptions) {
    // A game it excluded was put back, or that exclusion was edited. (An
    // exclusion added since can't be among its excluded games.)
    const exclusionChanges = new Set(
      changedRules(entry.exceptions.exclusions, current.exclusions).map(
        (r) => r.id,
      ),
    );
    if (entry.parsed.excluded.some((e) => exclusionChanges.has(e.exclusionId)))
      return true;
    // A changed exception applies (or applied) to one of its games.
    const changes = changedRules(
      entry.exceptions.exceptions,
      current.exceptions,
    );
    if (!changes.length) return false;
    return entry.parsed.files.some((file) => {
      const id = gameMatchId(entry.parsed.parserType, file);
      return changes.some((rule) => !!ruleFor([rule], id, file.titles.extracted));
    });
  }

  // A copy of a parse result, leaving out games excluded since.
  private withExclusions(
    parsed: ParsedUserConfiguration,
    exceptions: UserExceptions,
  ): ParsedUserConfiguration {
    const copy = _.cloneDeep(parsed);
    copy.files = copy.files.filter((file) => {
      const rule = ruleFor(
        exceptions.exclusions,
        gameMatchId(copy.parserType, file),
        file.titles.extracted,
      );
      if (!rule) return true;
      copy.excluded.push({
        exclusionId: rule.id,
        title: ruleTitle(rule) || file.titles.extracted,
        filePath: file.filePath,
      });
      return false;
    });
    return copy;
  }
}
