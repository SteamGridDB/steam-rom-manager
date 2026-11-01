import { Injectable } from "@angular/core";
import { SettingsService } from "../services";
import { languageManager } from "../../variables";
import { APP } from "../../variables";
import { BehaviorSubject } from "rxjs";
import { parse } from "bcp-47";

@Injectable()
export class LanguageService {
  private languageChange = new BehaviorSubject<string>(null);

  constructor(private settingsService: SettingsService) {
    this.settingsService.onLoad((appSettings) => {
      APP.lang = languageManager.getLanguage(appSettings.language);
      this.languageChange.next(appSettings.language);
    });
  }

  observeChanges() {
    return this.languageChange.asObservable();
  }

  getAvailableLanguages() {
    return languageManager.getAvailableLanguages();
  }

  // The language's name in itself, e.g. "Deutsch (Deutschland)".
  getReadableName(languageKey: string) {
    // Crowdin's code for Serbian (Cyrillic) uses "SP" for Serbia (RS).
    const code = languageKey === "sr-SP" ? "sr-RS" : languageKey;
    const schema = parse(code);
    try {
      // Names in the full locale: zh-TW reads 台灣, not zh's 台湾.
      const lang = new Intl.DisplayNames([code], { type: "language" }).of(
        schema.language,
      );
      const region = schema.region
        ? new Intl.DisplayNames([code], { type: "region" }).of(schema.region)
        : undefined;
      return region ? `${lang} (${region})` : lang;
    } catch (e) {
      return languageKey;
    }
  }

  loadLanguage(languageKey: string) {
    if (languageKey !== this.languageChange.getValue()) {
      APP.lang = languageManager.getLanguage(languageKey);
      this.languageChange.next(languageKey);
    }
  }
}
