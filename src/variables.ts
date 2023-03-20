import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
import * as os from 'os';
import * as process from 'process'

export const languageManager = new LanguageManager();
export const APP: GlobalContainer = {
    lang: languageManager.getLanguage('en-US'),
    version: require('../package.json')['version'],
    os: os.platform()==='win32' && parseInt(os.release().split('.').pop()) >= 22000 ? 'Windows 11' : require('os-name')(),
    arch: os.arch(),
    srmdir: process.env.PORTABLE_EXECUTABLE_DIR||''
};
