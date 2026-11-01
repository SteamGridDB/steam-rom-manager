// Keeps every language folder in en-US's layout (yarn lang:sync, and the
// check behind yarn lang:check and the tests). Per language:
// - langStrings.json: only usable translations (see lang-conform.ts), in
//   en-US's key order. Missing, obsolete, reshaped and untranslated entries
//   are left out; the app shows en-US for them.
// - markdown/: only files en-US has, and only real translations (copies of
//   the English text are removed).
// With `history`, copies of earlier versions of en-US's text count as
// untranslated too (old Crowdin exports carry the English of their day). A
// doc counts as untranslated when nearly all of its text is English: lines of
// some en-US doc, current or earlier (exports mix versions; docs got
// renamed), or English prose (see lineLanguage).
import * as fs from "fs";
import * as path from "path";
import { ConformIssue, conform, countStrings } from "./lang-conform";

export const reference = "en-US";

// Earlier en-US texts: strings by key path (JSON-encoded); every line of
// every doc (see docLines).
export interface EnglishHistory {
  strings: Map<string, Set<string>>;
  docLines: Set<string>;
}

// A doc's non-empty lines, ignoring whitespace (incl. table cell padding).
export const docLines = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/\s+/g, " ")
        .replace(/ ?\| ?/g, "|")
        .trim(),
    )
    .filter(Boolean);

// Share of a doc's text (in characters) that must be English for the doc to
// count as an untranslated copy.
const englishDocShare = 0.9;

// Words that make up a good part of any English sentence, and rarely of
// other languages' (even Latin-script ones).
const englishWords = new Set(
  (
    "the a an and or of to in is are be will can you your this that it for " +
    "with on as by if from not at so use when which there they these but all " +
    "any should may has have was were into only also than then its we our do"
  ).split(" "),
);

// A line's words, without markup (code, links, images, tables).
const proseWords = (line: string) =>
  line
    .toLowerCase()
    .replace(/!?\[[^\]]*\]\([^)]*\)|`[^`]*`|\{[^}]*\}|[^\p{L}' ]/gu, " ")
    .split(/\s+/)
    .filter((w) => /\p{L}{2}/u.test(w));

// "english": an en-US line, or English prose that never was in an en-US file
// (some translation files were edited in English directly): plain ASCII and a
// fifth or more English function words. "neutral": too little prose to tell
// (headings, table rules, images, code). Otherwise "translated".
export function lineLanguage(
  line: string,
  englishLines: Set<string>,
): "english" | "neutral" | "translated" {
  if (englishLines.has(line)) return "english";
  // Letters English doesn't use: translated, whatever the word count (CJK
  // scripts don't separate words with spaces).
  const prose = proseWords(line).join(" ");
  if ((prose.match(/[^\x00-\x7F\s'’]/gu) ?? []).length >= 4) {
    return "translated";
  }
  const words = proseWords(line);
  if (words.length < 5) return "neutral";
  return !/[^\x00-\x7F]/.test(line) &&
    words.filter((w) => englishWords.has(w)).length >= 0.2 * words.length
    ? "english"
    : "translated";
}

export interface LanguageReport {
  code: string;
  strings: { translated: number; total: number };
  docs: { translated: number; total: number };
  issues: ConformIssue[];
  // What syncing changes (empty: the folder is already in sync).
  changes: string[];
}

const normalize = (text: string) => text.replace(/\r\n/g, "\n");

function eolOf(file: string) {
  return fs.existsSync(file) && fs.readFileSync(file, "utf8").includes("\r\n")
    ? "\r\n"
    : "\n";
}

export function syncLanguages(
  langDir: string,
  { write, history }: { write: boolean; history?: EnglishHistory },
): LanguageReport[] {
  const isEnglish = history
    ? (path: string, value: string | string[]) =>
        !!history.strings.get(path)?.has(JSON.stringify(value))
    : undefined;
  const enDir = path.join(langDir, reference);
  const en = JSON.parse(
    fs.readFileSync(path.join(enDir, "langStrings.json"), "utf8"),
  );
  const enDocs = fs.readdirSync(path.join(enDir, "markdown")).sort();
  const enDocText = Object.fromEntries(
    enDocs.map((f) => [
      f,
      normalize(fs.readFileSync(path.join(enDir, "markdown", f), "utf8")),
    ]),
  );
  const english = new Set([
    ...Object.values(enDocText).flatMap(docLines),
    ...(history?.docLines ?? []),
  ]);
  const isEnglishDoc = (doc: string, text: string) => {
    if (normalize(text) === enDocText[doc]) return true;
    let englishChars = 0;
    let translatedChars = 0;
    for (const line of docLines(text)) {
      const language = lineLanguage(line, english);
      if (language === "english") englishChars += line.length;
      if (language === "translated") translatedChars += line.length;
    }
    return englishChars >= englishDocShare * (englishChars + translatedChars);
  };
  const codes = fs
    .readdirSync(langDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== reference)
    .map((d) => d.name)
    .sort();

  return codes.map((code) => {
    const dir = path.join(langDir, code);
    const changes: string[] = [];
    const issues: ConformIssue[] = [];

    const stringsFile = path.join(dir, "langStrings.json");
    const current = fs.existsSync(stringsFile)
      ? fs.readFileSync(stringsFile, "utf8")
      : "{}";
    const conformed =
      conform(en, JSON.parse(current), { issues, isEnglish }) ?? {};
    const expected = JSON.stringify(conformed, null, 2) + "\n";
    if (normalize(current) !== expected) {
      changes.push("langStrings.json");
      if (write) {
        const eol = eolOf(stringsFile);
        fs.writeFileSync(stringsFile, expected.replace(/\n/g, eol));
      }
    }

    const mdDir = path.join(dir, "markdown");
    const docs = fs.existsSync(mdDir) ? fs.readdirSync(mdDir).sort() : [];
    let translatedDocs = 0;
    for (const doc of docs) {
      const file = path.join(mdDir, doc);
      if (!enDocs.includes(doc)) {
        changes.push(`markdown/${doc} (not in en-US)`);
      } else if (isEnglishDoc(doc, fs.readFileSync(file, "utf8"))) {
        changes.push(`markdown/${doc} (untranslated copy)`);
      } else {
        translatedDocs++;
        continue;
      }
      if (write) fs.rmSync(file);
    }

    return {
      code,
      strings: { translated: countStrings(conformed), total: countStrings(en) },
      docs: { translated: translatedDocs, total: enDocs.length },
      issues,
      changes,
    };
  });
}
