// The shape of SRM's UI text comes from en-US itself, so it can't drift from
// the files: a key used in code must exist in en-US/langStrings.json (or be a
// markdown doc listed in lang/index.ts). Other languages are checked against
// en-US by lib/lang-conform.ts and scripts/lang-sync.ts.
import type enUSStrings from "../lang/en-US/langStrings.json";
import type { markdownFor } from "../lang";

export type LangStrings = typeof enUSStrings;
export type LangMarkdown = ReturnType<typeof markdownFor>;
export type languageStruct = LangStrings & LangMarkdown;
