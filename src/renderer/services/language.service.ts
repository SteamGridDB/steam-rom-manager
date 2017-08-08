import { Injectable } from '@angular/core';
import { SettingsService } from "../services";
import { LanguageManager } from "../../shared/lib";
import { gApp } from "../app.global";
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LanguageService {
    private languageChange = new BehaviorSubject<string>(null);
    private languageManager = new LanguageManager();

    constructor(private settingsService: SettingsService) {
        this.settingsService.onLoad((appSettings) => {
            gApp.lang = this.languageManager.getLanguage(appSettings.language);
            this.languageChange.next(appSettings.language);
        });
    }

    observeChanges() {
        return this.languageChange.asObservable();
    }

    getAvailableLanguages() {
        return this.languageManager.getAvailableLanguages();
    }

    loadLanguage(languageKey: string) {
        if (languageKey !== this.languageChange.getValue()) {
            gApp.lang = this.languageManager.getLanguage(languageKey);
            this.languageChange.next(languageKey);
        }
    }
}