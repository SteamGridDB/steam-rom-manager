import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
// Language strings are filled in with String.prototype.interpolate.
import "./lib/string-interpolation";
import * as os from "os";
import * as process from "process";
import osName from "os-name";

// Same value app.getVersion() reports, without needing Electron.
const { version } = require("../package.json");

export const languageManager = new LanguageManager();

let opsysName: string;
try {
  opsysName = osName(os.platform(), os.release());
} catch (e) {
  opsysName = `${os.platform()} (${os.release()})`;
}

export const APP: GlobalContainer = {
  lang: languageManager.getLanguage("en-US"),
  os: opsysName,
  version,
  arch: os.arch(),
  srmdir: process.env.PORTABLE_EXECUTABLE_DIR || "",
};
