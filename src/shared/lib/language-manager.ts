import * as languages from "../lang";
import { languageContainer } from "../models";

class LanguageManager {
    private availableLanguages: languageContainer = {};

    constructor() {
        for (let langData in languages) {
            for (let language in languages[langData]) {
                this.availableLanguages[language] = languages[langData][language];
            }
        }
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
        if (this.availableLanguages['English'] === undefined)
            return this.getAvailableLanguages()[0];
        else
            return 'English';
    }
};

export const languageManager = new LanguageManager();