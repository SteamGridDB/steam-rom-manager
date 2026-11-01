// yarn lang:sync   - bring every language folder into en-US's layout
// yarn lang:check  - report what lang:sync would change (exit 1 if anything)
// Both print how much of each language is translated.
import * as path from "path";
import { execFileSync } from "child_process";
import {
  EnglishHistory,
  docLines,
  reference,
  syncLanguages,
} from "../src/lib/lang-sync";

const repo = path.join(__dirname, "..");
const check = process.argv.includes("--check");
const verbose = process.argv.includes("--verbose");

// Every version of en-US's files in git history. Translation tools export
// untranslated text as the English of the day; such copies aren't
// translations, however old.
function englishHistory(): EnglishHistory | undefined {
  const git = (args: string[], input?: string) =>
    execFileSync("git", args, {
      cwd: repo,
      input,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
  let log: string;
  try {
    log = git([
      "log",
      "--all", // en-US versions on any branch (Crowdin's source may differ)
      "--raw",
      "--no-abbrev",
      "--format=",
      "--",
      `src/lang/${reference}`,
      "src/lang/en", // before language codes became BCP 47 (2023)
    ]);
  } catch (e) {
    console.warn("No git history; only current en-US text counts as English.");
    return undefined;
  }
  // ":100644 100644 <old> <new> M\t<path>": both blobs were en-US text.
  const blobs = new Map<string, string>();
  for (const line of log.split("\n")) {
    const match = line.match(/^:\S+ \S+ (\w+) (\w+) \S+\t(.+)$/);
    if (!match) continue;
    for (const blob of [match[1], match[2]]) {
      if (!/^0+$/.test(blob)) blobs.set(blob, match[3]);
    }
  }
  const history: EnglishHistory = { strings: new Map(), docLines: new Set() };
  const flatten = (value: any, prefix: string) => {
    if (typeof value === "string" || Array.isArray(value)) {
      let values = history.strings.get(prefix);
      if (!values) history.strings.set(prefix, (values = new Set()));
      values.add(JSON.stringify(value));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        flatten(v, prefix ? `${prefix}.${k}` : k);
      }
    }
  };
  for (const [blob, file] of blobs) {
    const text = git(["cat-file", "-p", blob]).replace(/\r\n/g, "\n");
    if (file.endsWith(".json")) {
      try {
        flatten(JSON.parse(text), "");
      } catch (e) {
        // an unparseable old version: nothing to learn from it
      }
    } else if (file.endsWith(".md")) {
      for (const line of docLines(text)) history.docLines.add(line);
    }
  }
  return history;
}

const reports = syncLanguages(path.join(repo, "src", "lang"), {
  write: !check,
  history: englishHistory(),
});

const pct = (n: number, total: number) =>
  `${Math.round((100 * n) / total)}%`.padStart(4);
console.log("language  strings  docs   changes");
for (const r of reports) {
  console.log(
    `${r.code.padEnd(8)}  ${pct(r.strings.translated, r.strings.total)}    ` +
      `${pct(r.docs.translated, r.docs.total)}   ` +
      (r.changes.length
        ? `${r.changes.length} ${check ? "to make" : "made"}`
        : "in sync"),
  );
  if (verbose) {
    for (const issue of r.issues) {
      console.log(`    dropped ${issue.kind}: ${issue.path}`);
    }
    for (const change of r.changes) console.log(`    ${change}`);
  }
}

const outOfSync = reports.filter((r) => r.changes.length);
if (check && outOfSync.length) {
  console.log(
    `\n${outOfSync.length} language(s) out of sync with en-US: run yarn lang:sync` +
      " (--verbose lists the changes).",
  );
  process.exit(1);
}
