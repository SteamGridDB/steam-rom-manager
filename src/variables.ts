import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
import * as os from 'os';
import * as fs from 'fs-extra';
import * as process from 'process';
import osName from 'os-name';

console.log()
export const languageManager = new LanguageManager();
export const APP: GlobalContainer = {
    lang: languageManager.getLanguage('en-US'),
    os: osName(os.platform(),os.release()),
    version: JSON.parse(fs.readFileSync('package.json','utf-8')).version,
    arch: os.arch(),
    srmdir: process.env.PORTABLE_EXECUTABLE_DIR||''
};
