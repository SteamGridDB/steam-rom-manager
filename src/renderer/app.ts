import "zone.js";
import "reflect-metadata";
import "../lib/string-interpolation";
import "../lib/replace-diacritics";

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { ipcRenderer } from "electron";
import { AppModule } from "./app.module";
import { setOwnedGamesFetcher } from "../lib/helpers/steam/owned-games";

// The Steam Web API must be called with Electron's network stack, which
// lives in the main process.
setOwnedGamesFetcher((apiKey, steamId) =>
  ipcRenderer.invoke("steam-owned-games", { apiKey, steamId }),
);

import "./styles/themes.global.scss";
import "./styles/fonts.global.scss";
import "./styles/main.global.scss";

if (process.env.NODE_ENV === "production") {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
