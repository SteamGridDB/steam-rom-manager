import {
  LanguageCode,
  languageCodes,
  languageFiles,
  markdownFor,
} from "../lang";
import { languageStruct } from "../models";
import { withFallback } from "./lang-conform";

const reference: LanguageCode = "en-US";

// The UI text of each language: en-US with the language's translations laid
// over it (see lang-conform.ts), so a partial or outdated translation shows
// English where it has nothing usable. Built on first use, then cached.
export class LanguageManager {
  private cache = new Map<string, languageStruct>();

  getAvailableLanguages(): string[] {
    return [...languageCodes];
  }

  getDefaultLanguage() {
    return reference;
  }

  isAvailable(language: string): language is LanguageCode {
    return (languageCodes as readonly string[]).includes(language);
  }

  // Unknown languages get en-US.
  getLanguage(language: string): languageStruct {
    const code = this.isAvailable(language) ? language : reference;
    if (!this.cache.has(code)) {
      this.cache.set(code, this.build(code));
    }
    return this.cache.get(code);
  }

  private build(code: LanguageCode): languageStruct {
    const english = languageFiles(reference);
    const files = code === reference ? english : languageFiles(code);
    const langStrings =
      code === reference
        ? structuredClone(english.langStrings as any)
        : withFallback(english.langStrings as any, files.langStrings);
    const markdowns = markdownFor(
      (file) => files.markdown(file) ?? english.markdown(file) ?? "",
    );
    return mergeDeep(langStrings, markdowns) as languageStruct;
  }
}

// Strings and markdown share some branches (e.g. parsers.component).
function mergeDeep(target: any, source: any) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
