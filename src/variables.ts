import { GlobalContainer } from "./models";
import { LanguageManager } from "./lib/language-manager";
import * as os from "os";
import * as process from "process";
import osName from "os-name";
import { app } from "@electron/remote";

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
  version: app.getVersion(),
  arch: os.arch(),
  srmdir: process.env.PORTABLE_EXECUTABLE_DIR || "",
};
