import { GlobalContainer } from "../renderer/models";
import { LanguageManager } from "../shared/lib/index";

export var gApp: GlobalContainer = {
    lang: new LanguageManager().getLanguage('English'),
    version: require('../../package.json')['version']
};