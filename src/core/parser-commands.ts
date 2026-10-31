import * as _ from "lodash";
import { ParserInfo, ParserType, UserConfiguration } from "../models";
import * as parserInfo from "../lib/parsers/available-parsers";
// (Node only: this module runs in the main process)
import { parsers } from "../lib/parsers";
import { listAvailableCompatTools } from "../lib/helpers/steam/list-compat-tools";
import { COMPAT_CUSTOM } from "../lib/helpers/steam/compat-constants";
import * as json from "../lib/helpers/json";
import { APP } from "../variables";
import * as schemas from "./schemas";
import * as modifiers from "./modifiers";
import {
  FieldValue,
  ParserField,
  emptyValue,
  getFieldValue,
  parserFields,
  setFieldValue,
} from "./parser-fields";
import type { Core } from "./core";

// Creating, editing, deleting and showing parsers from the command line,
// with the same fields, required settings and validation as the parser
// editor (see parser-fields.ts).

// A value as given on the command line: text, a list, or a switch.
export type RawValue = string | string[] | boolean;
// Given settings, by option name (e.g. { "rom-directory": "D:/roms" }).
export type FieldInput = Record<string, RawValue>;

// ok: `value` is set; otherwise `errors` says why.
export interface Result<T> {
  ok: boolean;
  value?: T;
  errors?: string[];
}

// Values only known at run time.
interface Context {
  customVariableGroups: string[];
  compatTools: FieldValue[];
}

export function parserInfos(): Partial<Record<ParserType, ParserInfo>> {
  return Object.fromEntries(
    parserInfo.availableParsers.map((type) => [
      type,
      parsers[type]?.getParserInfo(),
    ]),
  );
}

export function allFields(): ParserField[] {
  return parserFields(parserInfos());
}

async function context(core: Core): Promise<Context> {
  const compatTools =
    APP.osType === "Linux"
      ? (
          await listAvailableCompatTools(
            core.parsers.getKnownSteamDirectories(),
          ).catch(() => [])
        ).map((t) => ({ value: t.name, label: t.displayName }))
      : [];
  return {
    customVariableGroups: Object.keys(core.customVariables.get() ?? {}),
    compatTools: [
      ...compatTools,
      { value: COMPAT_CUSTOM, label: "Custom", aliases: ["custom"] },
    ],
  };
}

export function fieldValues(field: ParserField, ctx?: Context): FieldValue[] {
  if (Array.isArray(field.values)) return field.values;
  if (field.values === "customVariableGroups") {
    return (ctx?.customVariableGroups ?? []).map((g) => ({
      value: g,
      label: g,
    }));
  }
  if (field.values === "compatTools") return ctx?.compatTools ?? [];
  return [];
}

// How a value is written on the command line, e.g. `0 (Disabled)`.
export function choiceText(value: FieldValue) {
  const name = value.aliases?.[0] ?? value.value;
  return value.label && value.label !== name
    ? `${name} (${value.label})`
    : name;
}

const loose = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

function matchValue(
  values: FieldValue[],
  given: string,
): FieldValue | undefined {
  const g = loose(given);
  return (
    values.find((v) => v.value === given) ??
    values.find((v) =>
      [v.value, v.label, ...(v.aliases ?? [])].some((x) => loose(x) === g),
    )
  );
}

// Store messages are written for the editor ("> ROMs directory is invalid!").
const plain = (message: string) =>
  message.replace(/^>\s*/, "").replace(/\\\n/g, " ").replace(/`/g, "").trim();

const show = (value: unknown) =>
  Array.isArray(value)
    ? value.map((v) => JSON.stringify(v)).join(" ")
    : JSON.stringify(value);

// A command line value as a config value, or why it isn't one.
function convert(field: ParserField, raw: RawValue, ctx: Context): Result<any> {
  const flag = `--${field.flag}`;
  const fail = (error: string): Result<any> => ({ ok: false, errors: [error] });
  switch (field.kind) {
    case "toggle": {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      const text = String(raw).toLowerCase();
      if (["true", "yes", "on", "1"].includes(text))
        return { ok: true, value: true };
      if (["false", "no", "off", "0"].includes(text))
        return { ok: true, value: false };
      return fail(`${flag} is a switch: use ${flag} or --no-${field.flag}`);
    }
    case "list":
      return {
        ok: true,
        value: (Array.isArray(raw) ? raw : [raw])
          .map(String)
          .filter((s) => s !== ""),
      };
    case "multiselect": {
      const values = fieldValues(field, ctx);
      const given = (Array.isArray(raw) ? raw : [raw])
        .map(String)
        .filter((s) => s !== "");
      const matched = given.map((g) => matchValue(values, g));
      const bad = given.filter((_g, i) => !matched[i]);
      if (bad.length) {
        return fail(
          values.length
            ? `${flag}: ${bad.map((b) => JSON.stringify(b)).join(", ")} ${bad.length > 1 ? "are" : "is"} not allowed. Choose from: ${values.map(choiceText).join(", ")}`
            : `${flag}: nothing to choose from yet (${field.values === "customVariableGroups" ? "no custom variable groups" : "no values"})`,
        );
      }
      return { ok: true, value: _.uniq(matched.map((v) => v.value)) };
    }
    case "select": {
      if (Array.isArray(raw)) {
        if (raw.length !== 1) return fail(`${flag} takes one value`);
        raw = raw[0];
      }
      const values = fieldValues(field, ctx);
      const matched = matchValue(values, String(raw));
      if (!matched) {
        return fail(
          `${flag} must be one of: ${values.map(choiceText).join(", ")}${raw === "" ? "" : ` (got ${JSON.stringify(raw)})`}`,
        );
      }
      return { ok: true, value: matched.value };
    }
    default:
      if (Array.isArray(raw)) {
        if (raw.length !== 1) {
          return fail(`${flag} takes one value (quote values with spaces)`);
        }
        raw = raw[0];
      }
      if (typeof raw === "boolean") return fail(`${flag} needs a value`);
      return { ok: true, value: String(raw) };
  }
}

// The store's verdict on a field's value (null: fine).
function validateField(
  core: Core,
  field: ParserField,
  value: any,
  config: UserConfiguration,
): string | null {
  if (!field.validation) return null;
  const { key, wrap } = field.validation;
  const error = core.parsers.validate(key, wrap ? wrap(value, config) : value);
  return error ? plain(error) : null;
}

function isEmpty(value: any) {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

// Why a field the user set doesn't apply to this parser.
function notApplicable(field: ParserField, config: UserConfiguration) {
  const flag = `--${field.flag}`;
  if (field.parserType && field.parserType !== config.parserType) {
    return `${flag} is a ${field.parserType} setting; this is a ${config.parserType} parser`;
  }
  return `${flag} doesn't apply here (${appliesNote(field)})`;
}

// When a field applies, in words (for help and errors).
export function appliesNote(field: ParserField): string {
  const types = (superType: string) =>
    parserInfo.superTypes[superType as keyof typeof parserInfo.superTypes].join(
      ", ",
    );
  const probe = (parserType: ParserType) =>
    field.appliesTo(emptyConfig(parserType) as any);
  if (field.id.startsWith("imageProviderAPIs.")) {
    return `when --image-providers includes ${field.path[1]}`;
  }
  if (field.id === "compatToolNameCustom") {
    return "when --compat-tool is custom (Linux only)";
  }
  if (field.parserType) {
    return `${field.parserType} parsers only`;
  }
  const applies = parserInfo.availableParsers.filter((t) => probe(t));
  if (applies.length === parserInfo.availableParsers.length)
    return "all parsers";
  if (!applies.length) return "Linux only";
  const rom = types(parserInfo.ROMType);
  const romOnly = applies.every(
    (t) => parserInfo.superTypesMap[t] === parserInfo.ROMType,
  );
  return romOnly
    ? `ROM parsers only: ${rom}`
    : `not for artwork-only parsers (${types(parserInfo.ArtworkOnlyType)})`;
}

function emptyConfig(parserType: ParserType) {
  return { parserType, parserInputs: {}, imageProviders: [] as string[] };
}

// A dependent parser input's condition, e.g. `--parse-strategy webapi`.
function dependencyNote(field: ParserField, fields: ParserField[]) {
  const name = field.path[1];
  for (const [type, info] of Object.entries(parserInfos())) {
    const dep = info?.inputs?.[name]?.hiddenUnless;
    if (type === field.parserType && dep) {
      const depField = fields.find((f) => f.id === `parserInputs.${dep.field}`);
      return `only when --${depField?.flag ?? dep.field} is ${dep.value}`;
    }
  }
  return undefined;
}

// A new parser's starting point: schema defaults plus the parser type's own
// initial values (what the editor starts from).
export function defaultConfig(parserType: ParserType): UserConfiguration {
  const config = new json.Validator(
    schemas.defaultUserConfiguration,
    modifiers.userConfiguration,
  ).getDefaultValues() as UserConfiguration;
  config.parserType = parserType;
  resetParserInputs(config);
  return config;
}

function resetParserInputs(config: UserConfiguration) {
  const inputs = parserInfos()[config.parserType]?.inputs ?? {};
  config.parserInputs = {};
  for (const [name, input] of Object.entries(inputs)) {
    config.parserInputs[name] =
      input.initialValue !== undefined
        ? (_.cloneDeep(input.initialValue) as any)
        : emptyValue(input.inputType);
  }
}

interface Applied {
  config: UserConfiguration;
  given: ParserField[];
  errors: string[];
}

// Applies the given settings to `config` (type first, so a new type's
// inputs start from their defaults). Reports unknown options, bad values and
// settings that don't apply.
async function apply(
  core: Core,
  config: UserConfiguration,
  input: FieldInput,
): Promise<Applied> {
  const fields = allFields();
  const ctx = await context(core);
  const errors: string[] = [];
  const given: ParserField[] = [];
  const entries = Object.entries(input);
  const typeField = fields.find((f) => f.id === "parserType");
  const typeEntry = entries.find(([flag]) => flag === typeField.flag);
  if (typeEntry) {
    const converted = convert(typeField, typeEntry[1], ctx);
    if (!converted.ok) return { config, given, errors: converted.errors };
    if (converted.value !== config.parserType) {
      config.parserType = converted.value;
      resetParserInputs(config);
    }
    given.push(typeField);
  }
  for (const [flag, raw] of entries) {
    if (flag === typeField.flag) continue;
    // A parser input name can belong to several types; prefer this one's.
    const candidates = fields.filter((f) => f.flag === flag);
    const field =
      candidates.find(
        (f) => !f.parserType || f.parserType === config.parserType,
      ) ?? candidates[0];
    if (!field) {
      errors.push(`Unknown option --${flag}`);
      continue;
    }
    const converted = convert(field, raw, ctx);
    if (!converted.ok) {
      errors.push(...converted.errors);
      continue;
    }
    setFieldValue(config, field, converted.value);
    given.push(field);
  }
  // Applies to the parser as it ends up (e.g. --steam-api-key needs
  // --parse-strategy webapi, which may come later on the line).
  for (const field of given) {
    if (!field.appliesTo(config)) {
      const dep =
        field.parserType === config.parserType && dependencyNote(field, fields);
      errors.push(
        dep ? `--${field.flag} applies ${dep}` : notApplicable(field, config),
      );
    }
  }
  return { config, given, errors };
}

// Problems with a parser's applicable fields: missing required ones and
// invalid values. `only`: just these fields (edit checks what it changed).
function check(
  core: Core,
  config: UserConfiguration,
  given: ParserField[],
  only?: ParserField[],
): string[] {
  const errors: string[] = [];
  for (const field of only ?? allFields()) {
    if (!field.appliesTo(config)) continue;
    const value = getFieldValue(config, field);
    const wasGiven = given.some((g) => g.id === field.id);
    const error = validateField(core, field, value, config);
    if (field.required && isEmpty(value)) {
      errors.push(`Missing --${field.flag} (${field.label})`);
    } else if (error) {
      errors.push(
        wasGiven
          ? `--${field.flag} ${show(value)}: ${error}`
          : `--${field.flag} (currently ${show(value)}): ${error}`,
      );
    }
  }
  return errors;
}

// Anything the field checks can't see (the whole-parser checks the app runs
// before using a parser, and the file format).
function finalCheck(core: Core, config: UserConfiguration): string[] {
  const validator = new json.Validator(
    schemas.userConfiguration,
    modifiers.userConfiguration,
  );
  const probe = _.cloneDeep(config);
  probe.parserId ||= "check";
  if (!validator.validate(probe).isValid()) {
    return [`Not a valid parser: ${validator.errorString}`];
  }
  if (!core.parsers.isConfigurationValid(probe)) {
    return ["Not a valid parser (the parser editor would show what's wrong)"];
  }
  return [];
}

// Finds a parser by id, or by name (emoji left out, any case).
export function findParser(
  core: Core,
  ref: string,
): Result<{ index: number; config: UserConfiguration }> {
  const configs = core.parsers.getAll();
  const byId = configs.findIndex((c) => c.parserId === ref);
  if (byId >= 0)
    return { ok: true, value: { index: byId, config: configs[byId] } };
  const name = (title: string) =>
    title
      .replace(/[^\x20-\x7E]+/g, "")
      .trim()
      .toLowerCase();
  const matches = configs
    .map((config, index) => ({ config, index }))
    .filter(({ config }) => name(config.configTitle) === name(ref));
  if (matches.length === 1) return { ok: true, value: matches[0] };
  if (matches.length > 1) {
    return {
      ok: false,
      errors: [
        `${JSON.stringify(ref)} matches ${matches.length} parsers; use an id: ${matches.map((m) => m.config.parserId).join(", ")}`,
      ],
    };
  }
  return {
    ok: false,
    errors: [
      `No parser with id or name ${JSON.stringify(ref)} (see "srm list")`,
    ],
  };
}

// Creates a parser from the given settings, or says what's wrong.
export async function createParser(
  core: Core,
  input: FieldInput,
): Promise<Result<UserConfiguration>> {
  const typeField = allFields().find((f) => f.id === "parserType");
  if (!(typeField.flag in input)) {
    return {
      ok: false,
      errors: [
        `Missing --${typeField.flag} (${typeField.label}). One of: ${fieldValues(typeField).map(choiceText).join(", ")}`,
      ],
    };
  }
  const ctx = await context(core);
  const type = convert(typeField, input[typeField.flag], ctx);
  if (!type.ok) return { ok: false, errors: type.errors };
  const { config, given, errors } = await apply(
    core,
    defaultConfig(type.value),
    input,
  );
  errors.push(...check(core, config, given));
  if (!errors.length) errors.push(...finalCheck(core, config));
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: core.parsers.add(config) };
}

// Changes the given settings of a parser. Only the changed settings are
// checked (a parser can't be edited into an invalid state, but unrelated
// problems don't block a change), except when the type changes.
export async function editParser(
  core: Core,
  ref: string,
  input: FieldInput,
): Promise<
  Result<{ config: UserConfiguration; changed: string[]; problems: string[] }>
> {
  const found = findParser(core, ref);
  if (!found.ok) return { ok: false, errors: found.errors };
  if (!Object.keys(input).length) {
    return {
      ok: false,
      errors: [
        "Nothing to change: give at least one setting (see srm edit --help)",
      ],
    };
  }
  const { index, config: saved } = found.value;
  const { config, given, errors } = await apply(
    core,
    _.cloneDeep(saved),
    input,
  );
  const typeChanged = config.parserType !== saved.parserType;
  errors.push(...check(core, config, given, typeChanged ? undefined : given));
  if (typeChanged && !errors.length) errors.push(...finalCheck(core, config));
  if (errors.length) return { ok: false, errors };
  core.parsers.update(index, config);
  return {
    ok: true,
    value: {
      config,
      changed: given.map((f) => `--${f.flag}`),
      // Left as they were, but worth knowing.
      problems: check(core, config, given),
    },
  };
}

// Finds parsers by id or name; all or nothing (a typo is reported rather
// than silently acting on the rest).
export function findParsers(
  core: Core,
  refs: string[],
): Result<UserConfiguration[]> {
  const errors: string[] = [];
  const found: UserConfiguration[] = [];
  for (const ref of refs) {
    const result = findParser(core, ref);
    if (result.ok) found.push(result.value.config);
    else errors.push(...result.errors);
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: _.uniqBy(found, (c) => c.parserId) };
}

export function deleteParsers(
  core: Core,
  refs: string[],
): Result<UserConfiguration[]> {
  const found = findParsers(core, refs);
  if (!found.ok) return found;
  for (const config of found.value) {
    core.parsers.delete(
      core.parsers.getAll().findIndex((c) => c.parserId === config.parserId),
    );
  }
  return found;
}

export interface ViewRow {
  flag: string;
  label: string;
  // As written on the command line (e.g. "Puzzle" "Fun").
  value: string;
  // The value itself, unquoted (lists: one per line).
  raw: string;
  required: boolean;
  // Set when the setting isn't used by this parser.
  unused?: string;
}

// A parser's settings, as the options that set them: the given ones (in
// that order), or every one that applies to it.
export function viewParser(
  core: Core,
  ref: string,
  flags: string[] = [],
): Result<{ config: UserConfiguration; rows: ViewRow[] }> {
  const found = findParser(core, ref);
  if (!found.ok) return { ok: false, errors: found.errors };
  const { config } = found.value;
  const fields = allFields();
  const unknown = flags.filter((flag) => !fields.some((f) => f.flag === flag));
  if (unknown.length) {
    return {
      ok: false,
      errors: unknown.map((flag) => `Unknown option --${flag}`),
    };
  }
  const chosen = flags.length
    ? flags.map((flag) => {
        const candidates = fields.filter((f) => f.flag === flag);
        return (
          candidates.find((f) => f.parserType === config.parserType) ??
          candidates[0]
        );
      })
    : fields.filter((field) => field.appliesTo(config));
  const rows = chosen.map((field): ViewRow => {
    const value = getFieldValue(config, field);
    const list = Array.isArray(value);
    const none =
      isEmpty(value) && !["text", "path", "dir"].includes(field.kind);
    return {
      flag: `--${field.flag}`,
      label: field.label,
      value: none ? "(none)" : show(value),
      raw: list ? value.join("\n") : value == null ? "" : String(value),
      required: field.required,
      unused: field.appliesTo(config)
        ? undefined
        : notApplicable(field, config),
    };
  });
  return { ok: true, value: { config, rows } };
}

export { dependencyNote };
