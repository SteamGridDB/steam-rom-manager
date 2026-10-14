import * as path from "path";

// Where SRM keeps its data (main process only; the UI has no file access).
// Tests and scripts set SRM_USER_DATA_DIR; otherwise Electron knows.
function resolveUserDataDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, "userData");
  }
  if (process.env.SRM_USER_DATA_DIR) {
    return process.env.SRM_USER_DATA_DIR;
  }
  return path.join(require("electron").app.getPath("userData"), "userData");
}

export const userDataDir: string = resolveUserDataDir();
export const userSettings: string = path.join(userDataDir, "userSettings.json");
// Themes: copies of the app's own (rewritten at start-up, for reference) and
// the user's.
export const themesDir: string = path.join(userDataDir, "themes");
export const defaultThemesDir: string = path.join(themesDir, "default");
export const userThemesDir: string = path.join(themesDir, "user");
export const userConfigurations: string = path.join(
  userDataDir,
  "userConfigurations.json",
);
export const controllerTemplates: string = path.join(
  userDataDir,
  "controllerTemplates.json",
);
export const devThemePath: string = "./renderer/styles/themes.global.scss";
export const savedListFilename: string = "addedItemsV2.json";
export const imageCacheFilename: string = "artworkCache.json";
export const fuzzyList: string = path.join(userDataDir, "fuzzyList.json");
export const fuzzyCache: string = path.join(userDataDir, "fuzzyCache.json");
export const customVariables: string = path.join(
  userDataDir,
  "customVariables.json",
);
export const userVariables: string = path.join(
  userDataDir,
  "userVariables.json",
);
export const userExceptions: string = path.join(
  userDataDir,
  "userExceptions.json",
);
export const configPresets: string = path.join(
  userDataDir,
  "configPresets.json",
);
