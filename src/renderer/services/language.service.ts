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

  getReadableName(languageKey: string) {
    const schema = parse(languageKey);
    const lang = new Intl.DisplayNames([schema.language], {
      type: "language",
    }).of(schema.language);
    const region = new Intl.DisplayNames([schema.language], {
      type: "region",
    }).of(schema.region);
    return `${lang} (${region})`;
  }

  loadLanguage(languageKey: string) {
    if (languageKey !== this.languageChange.getValue()) {
      APP.lang = languageManager.getLanguage(languageKey);
      this.languageChange.next(languageKey);
    }
  }
}
