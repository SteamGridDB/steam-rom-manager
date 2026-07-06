import { ParserInfo, GenericParser, ParsedData } from "../../models";
import { APP } from "../../variables";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as genericParser from "@node-steam/vdf";
import * as path from "path";
import * as bvdf from "binary-vdf-2";
import { glob } from "glob";
import * as steam from "../helpers/steam";
import { ipcRenderer } from "electron";

export class SteamParser implements GenericParser {
  private get lang() {
    return APP.lang.steamParser;
  }
  getParserInfo(): ParserInfo {
    return {
      title: "Steam",
      info: this.lang.docs__md.self.join(""),
      inputs: {
        appTypes: {
          label: "Application Types",
          inputType: "multiselect",
          allowedValues: [
            { value: "game", displayValue: "Full Games" },
            { value: "demo", displayValue: "Demos" },
            {
              value: "application",
              displayValue: "Tools (e.g. Wallpaper Engine)",
            },
            { value: "sourcemods", displayValue: "Source Mods" },
          ],
          initialValue: ["game"],
          info: this.lang.docs__md.input.join(""),
        },
        onlyInstalled: {
          label: this.lang.onlyInstalledTitle,
          inputType: "toggle",
          info: this.lang.docs__md.input.join(""),
        },
        parseStrategy: {
          label: "Game fetch strategy",
          inputType: "select",
          allowedValues: [
            {
              value: "installed",
              displayValue: "Installed at least once (offline)",
            },
            {
              value: "webapi",
              displayValue:
                "All owned games (Steam Web API — online, needs key)",
            },
          ],
          initialValue: "installed",
          info: this.lang.docs__md.input.join(""),
        },
        steamApiKey: {
          label: "Steam Web API key",
          inputType: "text",
          placeholder: "Only used by the Steam Web API strategy",
          info: this.lang.docs__md.input.join(""),
        },
      },
    };
  }

  execute(
    directories: string[],
    inputs: { [key: string]: any },
    cache?: { [key: string]: any },
  ) {
    return new Promise<ParsedData>(async (resolve, reject) => {
      if (!directories || directories.length == 0) {
        return reject(this.lang.errors.noSteamAccounts);
      }
      const appinfo_path = path.normalize(
        path.join(directories[0], "..", "..", "appcache", "appinfo.vdf"),
      );
      let appinfos;
      try {
        appinfos = await bvdf.readBinaryVDF(fs.createReadStream(appinfo_path));
      } catch (error) {
        throw this.lang.errors.steamChanged__i.interpolate({
          error,
          file: appinfo_path,
        });
      }
      try {
        const allowedTypes = (inputs.appTypes || []).filter(
          (x: string) => x !== "sourcemods",
        );
        // Map appid -> { name, type } from the (global) appinfo cache. Used as
        // the base list for the offline strategy and to enrich/type-filter the
        // Web API strategy.
        const appinfoMap: {
          [appid: string]: { name: string; type: string };
        } = {};
        for (const a of appinfos) {
          if (a?.appinfo?.appid && a?.appinfo?.common?.name) {
            appinfoMap[a.appinfo.appid.toString()] = {
              name: a.appinfo.common.name.toString(),
              type: (a.appinfo.common.type || "").toLowerCase(),
            };
          }
        }

        let installedIds: string[];
        if (inputs.onlyInstalled) {
          const libraryfolders_path = path.normalize(
            path.join(
              directories[0],
              "..",
              "..",
              "steamapps",
              "libraryfolders.vdf",
            ),
          );
          try {
            const libraryFolders: any = genericParser.parse(
              fs.readFileSync(libraryfolders_path, "utf-8"),
            );
            installedIds = _.union(
              ...Object.values(libraryFolders.libraryfolders).map((x: any) =>
                Object.keys(x.apps),
              ),
            );
          } catch (e) {
            throw this.lang.errors.steamChanged__i.interpolate({
              error: e,
              file: libraryfolders_path,
            });
          }
        }

        let filteredApps: { title: string; appid: string }[] = [];
        const strategy = inputs.parseStrategy || "installed";

        if (strategy === "webapi") {
          // Complete ownership list from the Steam Web API (requires a key and
          // an internet connection). Ownership comes from the API; type
          // filtering is best-effort via the local appinfo cache.
          const apiKey = (inputs.steamApiKey || "").trim();
          if (!apiKey) {
            return reject(this.lang.errors.noApiKey);
          }
          const accountID = path.basename(
            directories[0].replace(/[\\/]+$/, ""),
          );
          const steamID64 = steam.accountID_ToSteamID64(accountID);
          let games: any[];
          try {
            // Performed in the main process (Electron net) so it uses the
            // system certificate store and proxy — see the "steam-owned-games"
            // handler in src/main/app.ts.
            const data: any = await ipcRenderer.invoke("steam-owned-games", {
              apiKey,
              steamId: steamID64,
            });
            if (!data || !data.response || data.response.games === undefined) {
              throw "No games were returned. Check that the API key is correct and that the account's game details are not set to private.";
            }
            games = data.response.games;
          } catch (e) {
            return reject(
              this.lang.errors.webApiError__i.interpolate({
                error: e instanceof Error ? e.message : e,
              }),
            );
          }
          for (const g of games) {
            const appid = (g.appid ?? "").toString();
            if (!appid) {
              continue;
            }
            if (inputs.onlyInstalled && !installedIds.includes(appid)) {
              continue;
            }
            const info = appinfoMap[appid];
            if (info && info.type) {
              if (!allowedTypes.includes(info.type)) {
                continue;
              }
            } else if (!allowedTypes.includes("game")) {
              // No cached type info; treat as a game.
              continue;
            }
            filteredApps.push({
              title: info?.name || (g.name || "").toString(),
              appid,
            });
          }
        } else {
          // Offline: ownership approximated by "installed at least once", i.e.
          // apps that have an entry in localconfig.vdf's apptickets.
          const localConfigPath = path.join(
            directories[0],
            "config",
            "localconfig.vdf",
          );
          const localConfig = genericParser.parse(
            fs.readFileSync(localConfigPath, "utf-8"),
          );
          const ticketKeys = Object.keys(
            localConfig.UserLocalConfigStore.apptickets,
          );
          filteredApps = appinfos
            .filter((a: any) => {
              return (
                a?.appinfo?.appid &&
                a?.appinfo?.common?.name &&
                allowedTypes.includes(
                  a?.appinfo?.common?.type?.toLowerCase(),
                ) &&
                ticketKeys.includes(a.appinfo.appid.toString()) &&
                (!inputs.onlyInstalled ||
                  installedIds.includes(a.appinfo.appid.toString()))
              );
            })
            .map((app: any) => {
              return {
                title: app.appinfo.common.name.toString(),
                appid: app.appinfo.appid.toString(),
              };
            });
        }
        if ((inputs.appTypes || []).includes("sourcemods")) {
          const wtfValve: number = 2147483649;
          const sourcemods_dir = path.normalize(
            path.join(directories[0], "..", "..", "steamapps", "sourcemods"),
          );
          const files = (
            await glob("*/gameinfo.txt", { dot: true, cwd: sourcemods_dir })
          ).sort();
          let sourceMods: { title: string; appid: string }[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileData = fs.readFileSync(
              path.join(sourcemods_dir, file),
              "utf-8",
            );
            const gameinfo: any = this.gameInfoParser(fileData);
            sourceMods.push({
              title: gameinfo.game,
              appid: (wtfValve + i).toString(),
            });
          }
          filteredApps = filteredApps.concat(sourceMods);
        }
        filteredApps = filteredApps.sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        const parsedData: ParsedData = { success: [], failed: [] };
        for (const app of filteredApps) {
          parsedData.success.push({
            extractedTitle: app.title,
            extractedAppId: app.appid,
          });
        }
        resolve(parsedData);
      } catch (error) {
        reject(this.lang.errors.fatalError__i.interpolate({ error }));
      }
    });
  }

  gameInfoParser(fileContents: string) {
    const lines = fileContents.split("\n");
    const sep = "\t";
    const uncommentedLines = lines
      .map((line) =>
        line
          .replace(/\/\/.*/g, "")
          .trim()
          .replace(/[\s,\t]+/g, sep),
      )
      .filter((line) => line.length > 0)
      .slice(1);
    // Parse uncommented lines into JSON object

    let currentObject: any = {};
    let i = 0;

    while (i < uncommentedLines.length) {
      const line = uncommentedLines[i].trim();
      i++;
      if (line === "{") {
        continue;
      } else if (line === "}") {
        // If we encounter a closing brace, move back to the parent object
        if (currentObject.parent) {
          currentObject = currentObject.parent;
        }
      } else if (line.includes(sep)) {
        // If we encounter a line with a tab character, split it into a key-value pair and add it to the current object
        const [key, value] = line
          .split(sep)
          .map((s) => s.trim().replace(/\"/g, ""));
        currentObject[key] = value;
      } else {
        // If we encounter a regular line, set it as the key of the current object and create a new object for its value
        const newObject: any = {};
        currentObject[line] = newObject;
        newObject.parent = currentObject;
        currentObject = newObject;
      }
    }
    return currentObject;
  }
}
