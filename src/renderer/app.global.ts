import { GlobalContainer } from "../renderer/models";
import { languageManager } from "../shared/lib/index";

export var gApp: GlobalContainer = {
    lang: languageManager.getLanguage('English'),
    version: require('../../package.json')['version'],
    os: require('os-name')(), 
    arch: require('os').arch()
};