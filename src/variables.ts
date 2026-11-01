import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
// Language strings are filled in with String.prototype.interpolate.
import "./lib/string-interpolation";
import { envInfo } from "./env-info";

// Same value app.getVersion() reports, without needing Electron.
const { version } = require("../package.json");

export const languageManager = new LanguageManager();

const env = envInfo();

export const APP: GlobalContainer = {
  lang: languageManager.getLanguage("en-US"),
  os: env.osName,
  osType: env.osType,
  version,
  arch: env.arch,
  srmdir: env.portableDir,
};
