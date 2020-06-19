import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
import * as os from 'os';
import * as process from 'process'

export const languageManager = new LanguageManager();

export const APP: GlobalContainer = {
    lang: languageManager.getLanguage('English'),
    version: require('../package.json')['version'],
    os: require('os-name')(os.platform(), os.release()),
    arch: os.arch(),
    srmdir: process.env.PORTABLE_EXECUTABLE_DIR||''
};
