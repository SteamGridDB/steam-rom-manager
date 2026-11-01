import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { languageCodes, languageFiles } from "../../src/lang";
import { LanguageManager } from "../../src/lib/language-manager";
import { conform, withFallback } from "../../src/lib/lang-conform";
import { syncLanguages } from "../../src/lib/lang-sync";

const langDir = path.join(__dirname, "../../src/lang");

// Every string's path and kind ("string" / "list" / "object" for empty ones).
function shape(value: any, prefix = ""): string[] {
  if (typeof value === "string") return [`${prefix}:string`];
  if (Array.isArray(value)) return [`${prefix}:list`];
  return Object.entries(value).flatMap(([k, v]) =>
    shape(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("languages", () => {
  it("lists exactly the language folders, en-US first", () => {
    const folders = fs
      .readdirSync(langDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect([...languageCodes].sort()).toEqual(folders.sort());
    expect(languageCodes[0]).toBe("en-US");
  });

  it("every language has en-US's exact shape, docs included", () => {
    const manager = new LanguageManager();
    const english = shape(manager.getLanguage("en-US"));
    for (const code of languageCodes) {
      const lang = manager.getLanguage(code);
      expect(shape(lang), code).toEqual(english);
      // every doc resolves to text (its translation or en-US's)
      const docs = JSON.stringify(lang);
      expect(docs, code).not.toMatch(/"undefined"/);
    }
  });

  it("uses translations where they're usable", () => {
    const manager = new LanguageManager();
    const en = manager.getLanguage("en-US");
    const de = manager.getLanguage("de-DE");
    const zh = manager.getLanguage("zh-CN");
    // de-DE and zh-CN translate the preview filter field
    expect(de.preview.component.filter).not.toBe(en.preview.component.filter);
    expect(zh.preview.component.filter).toBe("搜索游戏");
    // ...and fall back for keys added after their last update
    expect(de.preview.service.info.savingCompatTools).toBe(
      en.preview.service.info.savingCompatTools,
    );
    // markdown: a translated doc, and one they don't have (group.md)
    expect(de.about.component.info__md[0]).not.toBe(
      en.about.component.info__md[0],
    );
    expect(de.parsers.component.docs__md.group).toEqual(
      en.parsers.component.docs__md.group,
    );
  });

  it("unknown languages get en-US; building one never changes another", () => {
    const manager = new LanguageManager();
    const before = JSON.stringify(manager.getLanguage("en-US"));
    for (const code of languageCodes) manager.getLanguage(code);
    expect(JSON.stringify(manager.getLanguage("xx-XX"))).toBe(before);
    expect(JSON.stringify(new LanguageManager().getLanguage("en-US"))).toBe(
      before,
    );
  });

  it("markdown that a language lacks is reported as missing (for the fallback)", () => {
    expect(languageFiles("de-DE").markdown("no-such-doc.md")).toBeUndefined();
    expect(languageFiles("en-US").markdown("about.md")).toMatch(/\S/);
  });
});

describe("language files", () => {
  // Fails after an en-US change that makes translations unusable (renamed
  // or reshaped keys, changed placeholders, removed docs), or when new
  // translation files arrive (e.g. from Crowdin): run yarn lang:sync.
  it("are in sync with en-US (yarn lang:sync)", () => {
    const outOfSync = syncLanguages(langDir, { write: false })
      .filter((r) => r.changes.length)
      .map((r) => `${r.code}: ${r.changes.slice(0, 3).join(", ")}`);
    expect(outOfSync).toEqual([]);
  });
});

describe("withFallback / conform", () => {
  const en = {
    a: "Apple",
    count__i: "${n} apps in ${dir}",
    list: ["one", "two"],
    os: { Windows_NT: "C:\\", Linux: "/" },
  };

  it("keeps valid translations, falls back for the rest", () => {
    const issues: any[] = [];
    const translated = {
      a: "Apfel",
      count__i: "${n} Apps", // a placeholder is missing
      list: ["eins"], // lists may differ in length
      os: "C:\\ oder /", // an old shape: a string where en-US has an object
      gone: "obsolete",
    };
    expect(conform(en, translated, { issues })).toEqual({
      a: "Apfel",
      list: ["eins"],
    });
    expect(issues).toEqual([
      { path: "count__i", kind: "placeholders" },
      { path: "os", kind: "shape" },
      { path: "gone", kind: "obsolete" },
    ]);
    expect(withFallback(en, translated)).toEqual({
      a: "Apfel",
      count__i: "${n} apps in ${dir}",
      list: ["eins"],
      os: { Windows_NT: "C:\\", Linux: "/" },
    });
  });

  it("placeholders may move; copies of the English text add nothing", () => {
    expect(conform(en, { count__i: "In ${dir}: ${n} Apps" })).toEqual({
      count__i: "In ${dir}: ${n} Apps",
    });
    expect(conform(en, { a: "Apple", list: ["one", "two"] })).toBeUndefined();
  });

  it("doesn't modify its inputs", () => {
    const copy = structuredClone(en);
    const translated = { os: { Linux: "~" } };
    const result = withFallback(en, translated);
    result.os.Windows_NT = "changed";
    expect(en).toEqual(copy);
    expect(translated).toEqual({ os: { Linux: "~" } });
  });
});
