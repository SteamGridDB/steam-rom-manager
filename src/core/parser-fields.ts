import {
  OnlineProviderType,
  ParserInfo,
  ParserType,
  UserConfiguration,
} from "../models";
import * as parserInfo from "../lib/parsers/available-parsers";
import {
  artworkTypes,
  artworkSingDict,
  artworkViewNames,
} from "../lib/artwork-types";
import {
  imageProviderNames,
  onlineProviders,
  providerInfo,
} from "../lib/image-providers/available-providers";
import { providerInfoLang } from "../lib/image-providers/available-providers-lang";
import { COMPAT_CUSTOM } from "../lib/helpers/steam/compat-constants";
import { APP } from "../variables";

// Every parser setting a person can set, in one place: what it is, which
// parser types it applies to, whether it's required, the values it accepts
// and how it's validated. The parser editor (labels, required markers, what
// it shows) and the command line (flags, help, checks) both read this, so
// they can't disagree. Validation itself is ParsersStore.validate().
//
// No file system access here: the renderer imports this too.

export type FieldKind =
  | "text"
  | "path" // a file
  | "dir" // a directory
  | "toggle"
  | "select" // one of `values`
  | "multiselect" // any of `values`
  | "list"; // free-form strings

export interface FieldValue {
  value: string;
  label: string;
  // Other spellings accepted on the command line.
  aliases?: string[];
}

// Values only known at run time (from the user's data or Steam).
export type DynamicValues = "customVariableGroups" | "compatTools";

// The ParsersStore.validate() key for a field, and how its value is passed.
export interface FieldValidation {
  key: string;
  wrap?: (value: any, config: UserConfiguration) => any;
}

export interface ParserField {
  // Where it lives in a UserConfiguration (e.g. "executable.path").
  id: string;
  path: string[];
  // Command line option (without "--").
  flag: string;
  kind: FieldKind;
  label: string;
  section: string;
  // Required wherever it applies. (Kept in step with validation by the
  // tests: a field is required exactly when its empty value fails.)
  required: boolean;
  appliesTo: (config: UserConfiguration) => boolean;
  values?: FieldValue[] | DynamicValues;
  validation?: FieldValidation;
  // The parser type a parser-specific input belongs to.
  parserType?: ParserType;
}

const lang = () => APP.lang.parsers.component;

const superType = (config: Partial<UserConfiguration>) =>
  config.parserType ? parserInfo.superTypesMap[config.parserType] : undefined;
// The editor's rules for which parsers see which fields.
export const appliesWhen = {
  always: () => true,
  romParsers: (config: Partial<UserConfiguration>) =>
    superType(config) === parserInfo.ROMType,
  notArtworkOnly: (config: Partial<UserConfiguration>) =>
    !!superType(config) && superType(config) !== parserInfo.ArtworkOnlyType,
  // Steam Play compatibility tools only exist on Linux.
  compat: (config: Partial<UserConfiguration>) =>
    appliesWhen.notArtworkOnly(config) && APP.osType === "Linux",
};

// "parseStrategy" -> "parse-strategy", "UWPDir" -> "uwp-dir".
export const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

function field(
  id: string,
  flag: string,
  kind: FieldKind,
  label: string,
  section: string,
  rest: Partial<ParserField> = {},
): ParserField {
  return {
    id,
    path: id.split("."),
    flag,
    kind,
    label,
    section,
    required: false,
    appliesTo: appliesWhen.always,
    ...rest,
  };
}

const validated = (
  key: string,
  wrap?: FieldValidation["wrap"],
): Partial<ParserField> => ({ validation: { key, wrap } });

// The fields every parser type has (parser- and provider-specific inputs
// are added by parserFields()).
export function commonFields(): ParserField[] {
  const l = lang();
  const s = l.section;
  const providerValues: FieldValue[] = onlineProviders.map((p) => ({
    value: p,
    label: imageProviderNames[p],
  }));
  return [
    // (not --type: Chromium reserves that, and the CLI also runs in Electron)
    field("parserType", "ptype", "select", l.label.parserType, s.basic, {
      required: true,
      values: parserInfo.availableParsers.map((p) => ({ value: p, label: p })),
      ...validated("parserType"),
    }),
    field("configTitle", "name", "text", l.label.configTitle, s.basic, {
      required: true,
      ...validated("configTitle"),
    }),
    field("group", "group", "text", l.label.group, s.basic),
    field(
      "steamDirectory",
      "steam-directory",
      "dir",
      l.label.steamDirectory,
      s.basic,
      {
        required: true,
        ...validated("steamDirectory"),
      },
    ),
    field(
      "userAccounts.specifiedAccounts",
      "user-accounts",
      "list",
      l.label.userAccounts,
      s.basic,
      {
        required: true,
        ...validated("userAccounts", (value) => ({ specifiedAccounts: value })),
      },
    ),
    field(
      "romDirectory",
      "rom-directory",
      "dir",
      l.label.romDirectory,
      s.basic,
      {
        required: true,
        appliesTo: appliesWhen.romParsers,
        ...validated("romDirectory"),
      },
    ),
    field(
      "steamCategories",
      "steam-categories",
      "list",
      l.label.steamCategories,
      s.basic,
      {
        appliesTo: appliesWhen.notArtworkOnly,
        ...validated("steamCategories"),
      },
    ),

    field(
      "executable.path",
      "executable",
      "path",
      l.label.executableLocation,
      s.executable,
      {
        appliesTo: appliesWhen.romParsers,
        ...validated("executable", (value) => ({ path: value })),
      },
    ),
    field(
      "executable.shortcutPassthrough",
      "shortcut-passthrough",
      "toggle",
      l.text.shortcut_passthrough,
      s.executable,
      { appliesTo: appliesWhen.romParsers },
    ),
    field(
      "executable.appendArgsToExecutable",
      "append-args-to-executable",
      "toggle",
      l.text.appendArgsToExecutable,
      s.executable,
      { appliesTo: appliesWhen.romParsers },
    ),
    field(
      "executableArgs",
      "executable-args",
      "text",
      l.label.executableArgs,
      s.executable,
      {
        appliesTo: appliesWhen.romParsers,
        ...validated("executableArgs"),
      },
    ),
    field(
      "executableModifier",
      "executable-modifier",
      "text",
      l.label.executableModifier,
      s.executable,
      { appliesTo: appliesWhen.romParsers, ...validated("executableModifier") },
    ),
    field(
      "startInDirectory",
      "start-in-directory",
      "dir",
      l.label.startInDirectory,
      s.executable,
      { appliesTo: appliesWhen.romParsers, ...validated("startInDirectory") },
    ),

    field(
      "titleModifier",
      "title-modifier",
      "text",
      l.label.titleModifier,
      s.titleModification,
      {
        appliesTo: appliesWhen.notArtworkOnly,
        ...validated("titleModifier"),
      },
    ),
    field(
      "titleFromVariable.limitToGroups",
      "title-from-variable",
      "multiselect",
      l.label.titleFromVariable,
      s.titleModification,
      { appliesTo: appliesWhen.romParsers, values: "customVariableGroups" },
    ),
    field(
      "titleFromVariable.caseInsensitiveVariables",
      "case-insensitive-variables",
      "toggle",
      l.text.caseInsensitiveVariables,
      s.titleModification,
      { appliesTo: appliesWhen.romParsers },
    ),
    field(
      "titleFromVariable.skipFileIfVariableWasNotFound",
      "skip-file-if-variable-not-found",
      "toggle",
      l.text.skipFileIfVariableWasNotFound,
      s.titleModification,
      { appliesTo: appliesWhen.romParsers },
    ),
    field(
      "sortAsFromVariable.limitToGroups",
      "sort-as-from-variable",
      "multiselect",
      l.label.sortAsFromVariable,
      s.titleModification,
      { appliesTo: appliesWhen.romParsers, values: "customVariableGroups" },
    ),
    field(
      "fuzzyMatch.replaceDiacritics",
      "fuzzy-replace-diacritics",
      "toggle",
      l.text.fuzzy_replaceDiacritic,
      s.titleModification,
      { appliesTo: appliesWhen.notArtworkOnly },
    ),
    field(
      "fuzzyMatch.removeCharacters",
      "fuzzy-remove-characters",
      "toggle",
      l.text.fuzzy_removeCharacters,
      s.titleModification,
      { appliesTo: appliesWhen.notArtworkOnly },
    ),
    field(
      "fuzzyMatch.removeBrackets",
      "fuzzy-remove-brackets",
      "toggle",
      l.text.fuzzy_removeBrackets,
      s.titleModification,
      { appliesTo: appliesWhen.notArtworkOnly },
    ),

    field(
      "steamInputEnabled",
      "steam-input",
      "select",
      l.label.steamInputEnabled,
      s.controllerTemplates,
      {
        appliesTo: appliesWhen.notArtworkOnly,
        values: [
          {
            value: "0",
            label: l.steamInputOptions.disabled,
            aliases: ["disabled"],
          },
          {
            value: "1",
            label: l.steamInputOptions.useDefault,
            aliases: ["default"],
          },
          {
            value: "2",
            label: l.steamInputOptions.enabled,
            aliases: ["enabled"],
          },
        ],
      },
    ),

    field(
      "compatToolName",
      "compat-tool",
      "select",
      l.label.compatToolName,
      s.steamPlayCompat,
      {
        appliesTo: appliesWhen.compat,
        values: "compatTools",
      },
    ),
    field(
      "compatToolNameCustom",
      "compat-tool-custom",
      "text",
      l.label.compatToolNameCustom,
      s.steamPlayCompat,
      {
        appliesTo: (config) =>
          appliesWhen.compat(config) && config.compatToolName === COMPAT_CUSTOM,
      },
    ),

    field(
      "imageProviders",
      "image-providers",
      "multiselect",
      l.label.imageProviders,
      s.artworkProvider,
      { values: providerValues },
    ),
    field(
      "onlineImageQueries",
      "online-image-queries",
      "list",
      l.label.onlineImageQueries,
      s.artworkProvider,
      validated("onlineImageQueries"),
    ),
    field(
      "imagePool",
      "image-pool",
      "text",
      l.label.imagePool,
      s.artworkProvider,
      validated("imagePool"),
    ),
    field(
      "drmProtect",
      "drm-protect",
      "toggle",
      l.text.drmProtect,
      s.artworkProvider,
    ),

    ...artworkTypes.map((type) =>
      field(
        `overlayImages.${type}`,
        `overlay-image-${type}`,
        "path",
        l.label.overlayImages__i.interpolate({
          artworkType: artworkViewNames[type].toLowerCase(),
        }),
        s.overlayArtwork,
      ),
    ),
    ...artworkTypes.map((type) =>
      field(
        `defaultImage.${type}`,
        `default-image-${type}`,
        "path",
        l.label.defaultImage__i.interpolate({
          artworkType: artworkSingDict[type],
        }),
        s.localArtwork,
        validated("defaultImage"),
      ),
    ),
    ...artworkTypes.map((type) =>
      field(
        `localImages.${type}`,
        `local-images-${type}`,
        "text",
        l.label.localImages__i.interpolate({
          artworkType: artworkViewNames[type].toLowerCase(),
        }),
        s.localArtwork,
        validated("localImages"),
      ),
    ),
  ];
}

// The image providers' own settings (e.g. SteamGridDB's styles), shown when
// the provider is in use.
export function providerFields(): ParserField[] {
  const fields: ParserField[] = [];
  for (const provider of onlineProviders) {
    const inputs = providerInfo[provider]?.inputs ?? {};
    for (const [name, input] of Object.entries(inputs)) {
      const kind: FieldKind =
        input.inputType === "toggle" ? "toggle" : "multiselect";
      fields.push(
        field(
          `imageProviderAPIs.${provider}.${name}`,
          `${kebab(provider)}-${kebab(name)}`,
          kind,
          `${imageProviderNames[provider]}: ${providerInfoLang[provider]?.inputs?.[name]?.label ?? name}`,
          lang().section.filtersFor__i.interpolate({
            provider: imageProviderNames[provider],
          }),
          {
            appliesTo: (config) =>
              (config.imageProviders ?? []).includes(
                provider as OnlineProviderType,
              ),
            values:
              kind === "multiselect"
                ? (input.allowedValues as string[]).map((v) => ({
                    value: v,
                    label: v.replace(/_/g, " "),
                  }))
                : undefined,
          },
        ),
      );
    }
  }
  return fields;
}

// A parser type's own inputs (e.g. Glob's glob), from its parser info.
export function parserInputFields(
  infos: Partial<Record<ParserType, ParserInfo>>,
): ParserField[] {
  const fields: ParserField[] = [];
  for (const type of parserInfo.availableParsers) {
    for (const [name, input] of Object.entries(infos[type]?.inputs ?? {})) {
      const dependsOn = input.hiddenUnless;
      fields.push(
        field(
          `parserInputs.${name}`,
          kebab(name),
          input.inputType,
          input.label,
          lang().section.parserSpecific,
          {
            parserType: type,
            required: !!input.required,
            appliesTo: (config) =>
              config.parserType === type &&
              !input.hidden &&
              (!dependsOn ||
                config.parserInputs?.[dependsOn.field] === dependsOn.value),
            values: input.allowedValues?.map((v) => ({
              value: String(v.value),
              label: v.displayValue ?? String(v.value),
            })),
            ...validated("parserInputs", (value, config) => ({
              parser: config.parserType,
              input: name,
              inputData: value,
            })),
          },
        ),
      );
    }
  }
  return fields;
}

// Every field: common, provider and parser-specific.
export function parserFields(
  infos: Partial<Record<ParserType, ParserInfo>>,
): ParserField[] {
  return [...commonFields(), ...providerFields(), ...parserInputFields(infos)];
}

// For the editor: the common field with this id.
export function commonField(id: string): ParserField {
  const found = commonFields().find((f) => f.id === id);
  if (!found) throw new Error(`Unknown parser field ${id}`);
  return found;
}

// The value a field holds in a config.
export function getFieldValue(config: any, field: ParserField): any {
  return field.path.reduce((node, key) => node?.[key], config);
}

export function setFieldValue(config: any, field: ParserField, value: any) {
  let node = config;
  for (const key of field.path.slice(0, -1)) {
    node[key] ??= {};
    node = node[key];
  }
  node[field.path[field.path.length - 1]] = value;
}

// A field's "nothing entered" value.
export function emptyValue(kind: FieldKind): any {
  switch (kind) {
    case "toggle":
      return false;
    case "multiselect":
    case "list":
      return [];
    default:
      return "";
  }
}
