import * as genericParser from "@node-steam/vdf";
import * as steam from "./helpers/steam";
import * as path from "path";
import * as fs from "fs-extra";
import { PreviewData, VDF_ExtraneousItemsData } from "../models";
import { LoggerService } from "../renderer/services";
import { Acceptable_Error } from "./acceptable-error";

// config.vdf nesting that holds the per-app compat-tool assignments. Steam
// writes these with this exact casing; we match existing keys case-insensitively
// but create missing ones with the canonical casing below.
const CONFIG_PATH = [
  "InstallConfigStore",
  "Software",
  "Valve",
  "Steam",
  "CompatToolMapping",
];

// Every per-game entry Steam has been observed to write uses priority 250.
const COMPAT_PRIORITY = "250";

// Return the value of the child of `obj` whose key matches `canonicalKey`
// case-insensitively, creating it (with canonical casing) if absent.
function getOrCreateChild(obj: any, canonicalKey: string): any {
  const existing = Object.keys(obj).find(
    (k) => k.toLowerCase() === canonicalKey.toLowerCase(),
  );
  const key = existing ?? canonicalKey;
  if (obj[key] === undefined || obj[key] === null) {
    obj[key] = {};
  }
  return obj[key];
}

export class CompatToolManager {
  constructor(private loggerService: LoggerService) {}

  // Patch each Steam install's config.vdf so SRM-managed shortcuts get their
  // forced Steam Play compatibility tool. config.vdf is per-install (not
  // per-user), so we iterate steam directories and write each file once.
  async save(
    previewData: PreviewData,
    extraneousAppIds: VDF_ExtraneousItemsData,
  ): Promise<void> {
    try {
      const steamDirectories = Object.keys(previewData);
      const availableTools = await steam.listAvailableCompatTools(
        steamDirectories,
      );
      const knownToolNames = new Set(availableTools.map((t) => t.name));

      for (const steamDirectory of steamDirectories) {
        this.saveForDirectory(
          steamDirectory,
          previewData,
          extraneousAppIds,
          knownToolNames,
        );
      }
    } catch (error) {
      throw new Acceptable_Error(error);
    }
  }

  private saveForDirectory(
    steamDirectory: string,
    previewData: PreviewData,
    extraneousAppIds: VDF_ExtraneousItemsData,
    knownToolNames: Set<string>,
  ) {
    const configPath = path.join(steamDirectory, "config", "config.vdf");
    if (!fs.existsSync(configPath)) {
      this.loggerService.error(
        `Could not force compatibility tools: config.vdf not found at ${configPath}.`,
      );
      return;
    }

    this.backup(configPath);
    const config =
      genericParser.parse(fs.readFileSync(configPath, "utf-8")) || {};

    // Walk/create InstallConfigStore -> ... -> CompatToolMapping.
    let mapping = config;
    for (const key of CONFIG_PATH) {
      mapping = getOrCreateChild(mapping, key);
    }

    const users = previewData[steamDirectory];

    // Remove mappings for shortcuts SRM is removing (Steam never prunes these
    // itself). Extraneous ids are the long app ids.
    for (const userId in users) {
      for (const appId of extraneousAppIds[steamDirectory]?.[userId] ?? []) {
        delete mapping[steam.shortenAppId(appId)];
      }
    }

    // Apply forced tools for shortcuts SRM is adding.
    for (const userId in users) {
      const apps = users[userId].apps;
      for (let appId of Object.keys(apps).filter(
        (id) => apps[id].status === "add",
      )) {
        const app = apps[appId];
        if (app.changedId) {
          appId = app.changedId;
        }
        const shortId = steam.shortenAppId(appId);
        const tool = app.compatToolName;

        if (!tool) {
          // No forced tool for this parser/game: leave any existing mapping
          // (possibly a user's manual choice) untouched.
          continue;
        }
        if (tool === steam.COMPAT_NONE) {
          // Explicit opt-out: reset a previously-forced game to Steam default.
          delete mapping[shortId];
          continue;
        }
        if (!knownToolNames.has(tool)) {
          this.loggerService.error(
            `Skipping compatibility tool "${tool}" for "${app.title}": no such tool found on disk. Check the name in the parser's "Force compatibility tool" field.`,
          );
          continue;
        }
        mapping[shortId] = {
          name: tool,
          config: "",
          priority: COMPAT_PRIORITY,
        };
      }
    }

    fs.writeFileSync(configPath, genericParser.stringify(config));
  }

  private backup(configPath: string) {
    const backupPath = configPath + ".backup";
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }
  }
}
