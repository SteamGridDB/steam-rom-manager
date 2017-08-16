import { app, remote } from 'electron';
import * as path from 'path';

let _userDataDir: string;

if (process.env.PORTABLE_EXECUTABLE_DIR)
    _userDataDir = path.join(path.dirname((app || remote.app).getPath('exe')), 'userData');
else
    _userDataDir = path.join((app || remote.app).getPath('userData'), 'userData');

export const userDataDir: string = _userDataDir;
export const userSettings: string = path.join(userDataDir, 'userSettings.json');
export const userThemesDir: string = path.join(userDataDir, 'User themes');
export const userConfigurations: string = path.join(userDataDir, 'userConfigurations.json');
export const devThemePath: string = '../src/renderer/styles/themes.global.scss';
export const savedListFilename: string = 'addedItemsV2.json';
export const fuzzyList: string = path.join(userDataDir, 'fuzzyList.json');
export const fuzzyCache: string = path.join(userDataDir, 'fuzzyCache.json');