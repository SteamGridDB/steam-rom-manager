import * as path from "path";

// Where SRM keeps its data. The main process resolves it once at startup and
// exports it as SRM_USER_DATA_DIR (inherited by renderer windows), so this
// module never needs Electron; plain Node callers (CLI, tests) set it too.
// Asking Electron directly is only a fallback.
function resolveUserDataDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, "userData");
  }
  if (process.env.SRM_USER_DATA_DIR) {
    return process.env.SRM_USER_DATA_DIR;
  }
  const app =
    process.type === "browser"
      ? require("electron").app
      : require("@electron/remote").app;
  return path.join(app.getPath("userData"), "userData");
}

export const userDataDir: string = resolveUserDataDir();
export const userSettings: string = path.join(userDataDir, "userSettings.json");
export const userThemesDir: string = path.join(userDataDir, "User themes");
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
