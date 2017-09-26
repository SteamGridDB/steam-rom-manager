import { GlobalContainer } from "../renderer/models";
import { languageManager } from "../shared/lib/index";
import * as os from 'os';

export var gApp: GlobalContainer = {
    lang: languageManager.getLanguage('English'),
    version: require('../../package.json')['version'],
    os: require('os-name')(os.platform(), os.release()), 
    arch: os.arch()
};