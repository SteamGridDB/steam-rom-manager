// Stand-in for src/variables.ts, which needs @electron/remote for the app
// version. Everything else is the real thing: same LanguageManager, same
// en-US strings and markdown (loaded via the .md require hook in setup.ts).
import * as os from "os";
import { GlobalContainer } from "../../src/models";
import { LanguageManager } from "../../src/lib/language-manager";

const pkg = require("../../package.json");

export const languageManager = new LanguageManager();

export const APP: GlobalContainer = {
  lang: languageManager.getLanguage("en-US"),
  os: os.platform(),
  version: pkg.version,
  arch: os.arch(),
  srmdir: "",
};
