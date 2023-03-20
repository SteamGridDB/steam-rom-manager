import * as languages from "../lang";
import { languageContainer } from "../models";

export class LanguageManager {
    private availableLanguages: languageContainer = {};

    constructor() {
        this.availableLanguages = languages;
    }

    getAvailableLanguages(){
        return Object.keys(this.availableLanguages);
    }

    getLanguage(language: string){
        if (this.availableLanguages[language] === undefined)
            return this.availableLanguages[this.getAvailableLanguages()[0]];
        else
            return this.availableLanguages[language];
    }

    getDefaultLanguage(){
        if (this.availableLanguages['en'] === undefined)
            return this.getAvailableLanguages()[0];
        else
            return 'en';
    }
};