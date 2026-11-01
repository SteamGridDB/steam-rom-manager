import { ConfigPresets, Logger } from "../models";
import { APP } from "../variables";
import * as json from "../lib/helpers/json";
import * as paths from "../paths";
import * as schemas from "./schemas";
import { Fetch, getJson } from "./http";
import { DownloadedJsonStore } from "./downloaded-json-store";

const hashesURL =
  "https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/master/files/presetsHashes.json";

function numericVersion(appVersion: string) {
  return appVersion
    .split(".")
    .map((s, i) => Number(s) * Math.pow(0.01, i - 1))
    .reduce((x, y) => x + y);
}

// The commit whose presets match `appVersion`: the first entry of
// presetsHashes.json at or above it (so an outdated SRM gets presets it
// understands), otherwise master.
export function commitLookup(
  appVersion: string,
  presetsHashes: { [version: string]: { commit: string } },
): string {
  try {
    const numericAppVersion = numericVersion(appVersion);
    for (const version in presetsHashes) {
      if (numericAppVersion <= numericVersion(version)) {
        return presetsHashes[version].commit;
      }
    }
  } catch (e) {}
  return "master";
}

// Parser presets: files/presets on GitHub (at the commit matching this SRM
// version), cached in configPresets.json.
export class PresetsStore extends DownloadedJsonStore<ConfigPresets> {
  constructor(logger: Logger, fetch: Fetch) {
    super(logger, fetch, new json.Validator(schemas.configPresets));
  }

  protected get localFile() {
    return paths.configPresets;
  }

  protected get lang() {
    return APP.lang.configPresets.service;
  }

  protected get repoDir() {
    return "files/presets";
  }

  protected async downloadRef() {
    const commit = commitLookup(
      APP.version,
      await getJson(this.fetch, hashesURL),
    );
    if (commit !== "master") {
      this.logger.info(
        `SRM is not up to date, cached config presets downloaded from commit: ${commit}`,
      );
    }
    return commit;
  }
}
