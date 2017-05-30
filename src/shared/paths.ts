import { app, remote } from 'electron';
import * as path from 'path';

export const userDataDir: string = path.join((app || remote.app).getPath('userData'), 'userData');;
export const userSettings: string = path.join(userDataDir, 'userSettings.json');
export const userThemesDir: string = path.join(userDataDir, 'User themes');
export const userConfigurations: string = path.join(userDataDir, 'userConfigurations.json');
export const preferedImages: string = path.join(userDataDir, 'preferedImagesV2.json');
export const allEditedSteamDirectories: string = path.join(userDataDir, 'allEditedSteamDirectories.json');
export const devThemePath: string = '../src/renderer/styles/global.themes.scss';
export const savedListFilename: string = 'addedItemsV2.json';
export const fuzzyList: string = path.join(userDataDir, 'fuzzyList.json');