import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import "../../src/lib/string-interpolation";

describe("String.prototype.interpolate", () => {
  it("substitutes ${name} placeholders", () => {
    expect("Killed Steam after ${elapsed}ms.".interpolate({ elapsed: 42 })).toBe(
      "Killed Steam after 42ms.",
    );
    expect("${a}${a} ${b}".interpolate({ a: "x", b: null })).toBe("xx null");
  });

  it("never evaluates anything", () => {
    (globalThis as any).__pwned = false;
    const evil = "${(globalThis.__pwned = true)} ${constructor}";
    expect(evil.interpolate({})).toBe(evil);
    expect((globalThis as any).__pwned).toBe(false);
  });

  it("leaves unknown placeholders and backslashes alone", () => {
    expect("C:\\Users\\${name} ${missing}".interpolate({ name: "me" })).toBe(
      "C:\\Users\\me ${missing}",
    );
  });

  it("every interpolated (__i) language string uses only plain placeholders", () => {
    const langDir = path.join(__dirname, "../../src/lang");
    const offenders: string[] = [];
    for (const lang of fs.readdirSync(langDir)) {
      const file = path.join(langDir, lang, "langStrings.json");
      if (!fs.existsSync(file)) continue;
      (function walk(o: any, at: string) {
        for (const [k, v] of Object.entries(o)) {
          const values =
            typeof v === "string" ? [v] : Array.isArray(v) ? v : null;
          if (values && k.endsWith("__i")) {
            for (const s of values) {
              const bad = (String(s).match(/\$\{[^}]*\}/g) ?? []).filter(
                (m) => !/^\$\{[A-Za-z_$][\w$]*\}$/.test(m),
              );
              if (bad.length) offenders.push(`${lang}:${at}${k} ${bad}`);
            }
          } else if (v && typeof v === "object") {
            walk(v, `${at}${k}.`);
          }
        }
      })(JSON.parse(fs.readFileSync(file, "utf8")), "");
    }
    expect(offenders).toEqual([]);
  });
});
