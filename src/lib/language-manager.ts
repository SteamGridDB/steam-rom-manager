import languages from "../lang";
import * as log from "electron-log";
import * as _ from "lodash";
import { languageContainer, languageStruct } from "../models";

export class LanguageManager {
  private availableLanguages: languageContainer = {};

  constructor() {
    this.availableLanguages = languages;
  }

  getAvailableLanguages() {
    return Object.keys(this.availableLanguages);
  }

  getLanguage(language: string) {
    if (this.availableLanguages[language] === undefined) {
      let langData = this.availableLanguages[this.getAvailableLanguages()[0]];
      return _.merge(
        langData.langStrings,
        langData.markdowns,
      ) as languageStruct;
    } else {
      let langData = this.availableLanguages[language];
      return _.merge(
        langData.langStrings,
        langData.markdowns,
      ) as languageStruct;
    }
  }

  getDefaultLanguage() {
    if (this.availableLanguages["en-US"] === undefined)
      return this.getAvailableLanguages()[0];
    else return "en-US";
  }
}
