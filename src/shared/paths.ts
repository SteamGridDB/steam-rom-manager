import { app, remote } from 'electron';
import * as path from 'path';

let dataDir: string = 'userData';
if (process.env.NODE_ENV === 'production'){
    dataDir = path.join(path.dirname((app || remote.app).getPath('userData')), dataDir);
}
else{
    dataDir = path.join(process.cwd(), dataDir);
}

export const userDataDir: string = dataDir;
export const userSettings: string = path.join(userDataDir, 'userSettings.json');
export const userThemesDir: string = path.join(userDataDir, 'User themes');
export const userConfigurations: string = path.join(userDataDir, 'userConfigurations.json');
export const preferedImages: string = path.join(userDataDir, 'preferedImages.json');
export const devThemePath: string = '../src/renderer/styles/global.themes.scss';
export const savedListFilename: string = 'addedItems.json';
export const fuzzyList: string = path.join(userDataDir, 'fuzzyList.json');