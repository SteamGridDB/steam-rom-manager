import { ParserType } from "../models";
import { availableParsers } from "../lib/parsers/available-parsers";
import {
  FieldInput,
  allFields,
  appliesNote,
  choiceText,
  defaultConfig as newConfig,
  dependencyNote,
  fieldValues,
} from "../core/parser-commands";
import { ParserField, emptyValue, getFieldValue } from "../core/parser-fields";

type Mode = "create" | "edit" | "view";

// Another name for --ptype (the parser type).
const typeAlias = "parser-type";

const loose = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const camel = (flag: string) =>
  flag.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

// The parser type named by --ptype on the command line, if it's a real one
// (help then shows just that type's settings).
function typeFromArgs(args: string[]): ParserType | undefined {
  let given: string | undefined;
  args.forEach((arg, i) => {
    for (const flag of ["--ptype", `--${typeAlias}`]) {
      if (arg === flag) given = args[i + 1];
      else if (arg.startsWith(`${flag}=`)) given = arg.slice(flag.length + 1);
    }
  });
  return given === undefined
    ? undefined
    : availableParsers.find((t) => loose(t) === loose(given));
}

const isEmpty = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

// Parser settings as command line options: declared from the shared field
// catalog (core/parser-fields.ts), with help grouped like the parser editor.
export function parserFieldOptions(args: string[]) {
  const fields = allFields();
  const helpType = typeFromArgs(args);
  const defaultsByType = new Map<ParserType, ReturnType<typeof newConfig>>();
  const defaultConfig = (type: ParserType) => {
    if (!defaultsByType.has(type)) defaultsByType.set(type, newConfig(type));
    return defaultsByType.get(type);
  };

  // Whether a field shows in help for `type` (dependent inputs show, with
  // their condition).
  const showsFor = (field: ParserField, type: ParserType) =>
    field.parserType
      ? field.parserType === type
      : field.appliesTo(defaultConfig(type));

  const defaultText = (field: ParserField, type?: ParserType) => {
    // (the type has no default: it decides everything else)
    if (field.id === "parserType") return "";
    if (field.parserType && field.parserType !== type && type) return "";
    const value = getFieldValue(
      defaultConfig(type ?? field.parserType ?? availableParsers[0]),
      field,
    );
    if (isEmpty(value) || value === emptyValue(field.kind)) return "";
    const values = fieldValues(field);
    const shown = (v: unknown) => {
      const match = values.find((x) => x.value === v);
      return match ? (match.aliases?.[0] ?? match.value) : String(v);
    };
    return `Default: ${Array.isArray(value) ? value.map(shown).join(" ") : shown(value)}`;
  };

  const describe = (field: ParserField, mode: Mode) => {
    // view: the option just names the setting
    if (mode === "view") return field.label.replace(/[:.]\s*$/, "");
    const parts: string[] = [field.label.replace(/[:.]\s*$/, "")];
    if (field.required) {
      const note = helpType || field.parserType ? "" : appliesNote(field);
      parts.push(
        note && note !== "all parsers" ? `REQUIRED (${note})` : "REQUIRED",
      );
    }
    const values = fieldValues(field);
    if (field.values === "customVariableGroups") {
      parts.push("Any of your custom variable groups");
    } else if (field.values === "compatTools") {
      parts.push("A compatibility tool installed in Steam, or custom");
    } else if (field.kind === "select") {
      parts.push(`One of: ${values.map(choiceText).join(", ")}`);
    } else if (field.kind === "multiselect") {
      parts.push(`Any of: ${values.map(choiceText).join(", ")}`);
    } else if (field.kind === "dir") {
      parts.push("A directory");
    } else if (field.kind === "path") {
      parts.push("A file");
    } else if (field.kind === "list") {
      parts.push("One or more values");
    }
    if (mode === "create") {
      const shownDefault = defaultText(field, helpType);
      if (shownDefault) parts.push(shownDefault);
    }
    const dependency = dependencyNote(field, fields);
    if (dependency) parts.push(`Applies ${dependency}`);
    else if (!helpType && !field.parserType) {
      const note = appliesNote(field);
      if (note !== "all parsers" && !field.required) parts.push(`(${note})`);
    }
    return parts.join(". ");
  };

  return {
    // Adds the options, help groups and checks to a create/edit/view
    // command (view: every option is a switch naming a setting to show).
    declare(y: any, mode: Mode) {
      // (required first)
      const groups = new Map<string, string[]>([["Required:", []]]);
      const addTo = (group: string, flag: string) =>
        groups.set(group, [...(groups.get(group) ?? []), flag]);
      for (const field of fields) {
        const hidden = !!helpType && !showsFor(field, helpType);
        y.option(field.flag, {
          alias: field.id === "parserType" ? typeAlias : undefined,
          describe: describe(field, mode),
          type:
            mode === "view" || field.kind === "toggle" ? "boolean" : "string",
          array:
            mode !== "view" &&
            (field.kind === "list" || field.kind === "multiselect"),
          hidden,
        });
        if (hidden) continue;
        // Required settings without a default come first when creating.
        // (without --ptype: just what every parser needs)
        const mustGive =
          mode === "create" &&
          field.required &&
          !defaultText(field, helpType) &&
          (helpType
            ? true
            : !field.parserType && appliesNote(field) === "all parsers");
        if (mustGive) addTo("Required:", field.flag);
        else if (field.parserType)
          addTo(`${field.parserType} settings:`, field.flag);
        else addTo(`${field.section}:`, field.flag);
      }
      for (const [name, flags] of groups)
        if (flags.length) y.group(flags, name);

      const known = new Set<string>([
        "_",
        "$0",
        "parser",
        "help",
        "version",
        // (older scripts; ids and names both work now)
        "names",
        typeAlias,
        camel(typeAlias),
      ]);
      for (const field of fields) {
        known.add(field.flag);
        known.add(camel(field.flag));
      }
      const flags = fields.map((f) => f.flag);
      y.check((argv: any) => {
        const unknown = Object.keys(argv)
          .filter((key) => !known.has(key))
          // (yargs adds a camelCase copy of each option)
          .filter(
            (key, _i, all) => !all.some((k) => k !== key && camel(k) === key),
          );
        if (unknown.length) {
          throw new Error(
            unknown
              .map((key) => {
                const close = closest(key, flags);
                return `Unknown option --${key}${close ? ` (did you mean --${close}?)` : ""}`;
              })
              .join("\n"),
          );
        }
        return true;
      });
      if (mode === "view") {
        y.epilogue(
          [
            "Name the settings to show, e.g. --ptype --name; with none, every setting that applies to the parser is shown.",
            "With one setting, just its value is printed (lists: one per line), for scripts.",
          ].join("\n"),
        );
        return y;
      }
      y.epilogue(
        [
          `Parser types: ${availableParsers.join(", ")}.`,
          helpType
            ? `Showing ${helpType} settings. Required ones are checked like in the parser editor.`
            : "Add --ptype <type> to --help to see just that type's settings, with what's required.",
          'Lists take several values: --steam-categories "Puzzle" "Fun". Switches: --drm-protect, or --no-drm-protect to turn off.',
          mode === "edit"
            ? "Only the options given change, and only to valid values; a new --ptype is checked as a whole."
            : "Settings left out get the parser editor's defaults; the parser is only created if it's valid.",
        ].join("\n"),
      );
      return y;
    },

    // The settings given on the command line, by option name.
    given(argv: any): FieldInput {
      const input: FieldInput = {};
      for (const field of fields) {
        if (argv[field.flag] !== undefined)
          input[field.flag] = argv[field.flag];
      }
      return input;
    },
  };
}

// The option most like a mistyped one (or undefined).
function closest(typo: string, options: string[]): string | undefined {
  let best: string | undefined;
  let bestScore = Infinity;
  // (hyphens ignored: --romdir is --rom-directory)
  const bare = (s: string) => s.replace(/-/g, "").toLowerCase();
  const t = bare(typo);
  for (const option of options) {
    const o = bare(option);
    const score =
      o.startsWith(t) || t.startsWith(o)
        ? Math.abs(o.length - t.length) / 4
        : distance(t, o);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return bestScore <= Math.max(2, typo.length / 3) ? best : undefined;
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_v, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[b.length];
}
