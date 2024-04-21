const app = process.type === 'browser' ? require('electron').app : require('@electron/remote').app;
import * as path from 'path';

let _userDataDir: string;

if (process.env.PORTABLE_EXECUTABLE_DIR) {
    _userDataDir = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'userData');
}
else {
    _userDataDir = path.join(app.getPath('userData'), 'userData');
}

export const userDataDir: string = _userDataDir;
export const userSettings: string = path.join(userDataDir, 'userSettings.json');
export const userThemesDir: string = path.join(userDataDir, 'User themes');
export const userConfigurations: string = path.join(userDataDir, 'userConfigurations.json');
export const controllerTemplates: string = path.join(userDataDir, 'controllerTemplates.json');
export const devThemePath: string = './renderer/styles/themes.global.scss';
export const savedListFilename: string = 'addedItemsV2.json';
export const imageCacheFilename: string = 'artworkCache.json';
export const fuzzyList: string = path.join(userDataDir, 'fuzzyList.json');
export const fuzzyCache: string = path.join(userDataDir, 'fuzzyCache.json');
export const customVariables: string = path.join(userDataDir, 'customVariables.json');
export const userExceptions: string = path.join(userDataDir, 'userExceptions.json');
export const configPresets: string = path.join(userDataDir, 'configPresets.json');
export const presetsData: string = path.join(userDataDir, 'presetsData.json');
