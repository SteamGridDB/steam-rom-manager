// en-US is the reference language: every other language is laid over it, so
// a translation can lag behind (missing keys) or be out of date (old keys,
// changed shapes) without breaking anything; such parts show in English.
//
// Pure functions, shared by the app (language-manager.ts), the tests and
// scripts/lang-sync.ts.

type Json = string | Json[] | { [key: string]: Json };

export interface ConformIssue {
  path: string;
  // obsolete: the key isn't in en-US; shape: string/list/object differs from
  // en-US; placeholders: an interpolated string (key ending "__i") doesn't
  // use the same ${...} variables as en-US.
  kind: "obsolete" | "shape" | "placeholders";
}

const isObject = (v: unknown): v is { [key: string]: Json } =>
  !!v && typeof v === "object" && !Array.isArray(v);

const kind = (v: unknown) =>
  typeof v === "string"
    ? "string"
    : Array.isArray(v)
      ? v.every((x) => typeof x === "string")
        ? "strings"
        : "array"
      : isObject(v)
        ? "object"
        : typeof v;

// The ${...} variables a string uses (sorted, unique).
export function placeholders(value: string | string[]): string[] {
  const text = Array.isArray(value) ? value.join("\n") : value;
  return [...new Set(text.match(/\$\{[^}]*\}/g) ?? [])].sort();
}

export interface ConformOptions {
  // Collects what was dropped, and why.
  issues?: ConformIssue[];
  // Also treat a value as untranslated when this says it's English text,
  // e.g. an earlier version of en-US's (scripts/lang-sync.ts uses git).
  isEnglish?: (path: string, value: string | string[]) => boolean;
}

// `translation` reduced to what can be used over `reference`: only keys the
// reference has, with the same shape (and, for "__i" strings, the same
// placeholders), in the reference's key order. Values equal to the reference
// are dropped too: an untranslated copy adds nothing over the fallback.
// Returns undefined when nothing is left.
export function conform(
  reference: Json,
  translation: unknown,
  options: ConformOptions = {},
  path = "",
): Json | undefined {
  const issues = (options.issues ??= []);
  if (translation === undefined) {
    return undefined;
  }
  if (kind(reference) !== kind(translation)) {
    issues.push({ path, kind: "shape" });
    return undefined;
  }
  if (isObject(reference)) {
    const source = translation as { [key: string]: unknown };
    const result: { [key: string]: Json } = {};
    for (const key of Object.keys(reference)) {
      const value = conform(
        reference[key],
        source[key],
        options,
        path ? `${path}.${key}` : key,
      );
      if (value !== undefined) {
        result[key] = value;
      }
    }
    for (const key of Object.keys(source)) {
      if (!(key in reference)) {
        issues.push({ path: path ? `${path}.${key}` : key, kind: "obsolete" });
      }
    }
    return Object.keys(result).length ? result : undefined;
  }
  const value = translation as string | string[];
  if (
    path.endsWith("__i") &&
    placeholders(value).join() !== placeholders(reference as string).join()
  ) {
    issues.push({ path, kind: "placeholders" });
    return undefined;
  }
  return JSON.stringify(value) === JSON.stringify(reference) ||
    options.isEnglish?.(path, value)
    ? undefined
    : value;
}

// `reference` with every usable value from `translation` (see conform).
// Never modifies its arguments.
export function withFallback<T extends Json>(
  reference: T,
  translation: unknown,
): T {
  return overlay(reference, conform(reference, translation)) as T;
}

function overlay(reference: Json, translated: Json | undefined): Json {
  if (translated === undefined) {
    return structuredClone(reference);
  }
  if (isObject(reference)) {
    const source = translated as { [key: string]: Json };
    return Object.fromEntries(
      Object.entries(reference).map(([key, value]) => [
        key,
        overlay(value, source[key]),
      ]),
    );
  }
  return structuredClone(translated);
}

// Number of strings (list items count once) in a language structure.
export function countStrings(value: Json | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "string" || Array.isArray(value)) return 1;
  return Object.values(value).reduce<number>(
    (sum, v) => sum + countStrings(v),
    0,
  );
}
