import * as fs from "fs-extra";
import * as path from "path";
import { escape } from "glob";
import { userAccountData } from "../models";
import * as paths from "../paths";
import { ArtworkCache } from "../lib/artwork-cache";
import { getAvailableLogins } from "../lib/helpers/steam/get-available-logins";
import { listAvailableCompatTools } from "../lib/helpers/steam/list-compat-tools";
import { CompatToolInfo } from "../lib/helpers/steam/compat-constants";
import { encodeFile } from "../lib/helpers/url/file-url";
import { Fetch } from "./http";
import { BugReport, BugReportResult, submitBugReport } from "./bug-report";

export type SteamLogin = userAccountData & {
  // file:// URL of Steam's cached avatar, if there is one.
  avatar: string | null;
};

// Small file-system jobs the UI asks for (it has no file system access).
export class UiSupport {
  constructor(private fetch: Fetch) {}

  // Accounts that have used Steam at `steamDirectory`.
  async steamLogins(steamDirectory: string): Promise<SteamLogin[]> {
    if (!steamDirectory || !(await fs.pathExists(steamDirectory))) {
      return [];
    }
    const logins = await getAvailableLogins(steamDirectory);
    return Promise.all(
      logins.map(async (login) => {
        const avatar = path.join(
          steamDirectory,
          "config",
          "avatarcache",
          `${login.steamID64}.png`,
        );
        return {
          ...login,
          avatar: (await fs.pathExists(avatar)) ? encodeFile(avatar) : null,
        };
      }),
    );
  }

  compatTools(steamDirectories: string[]): Promise<CompatToolInfo[]> {
    return listAvailableCompatTools(steamDirectories);
  }

  // Forgets the artwork chosen for every title.
  async clearArtworkCache() {
    const artworkCache = new ArtworkCache();
    await artworkCache.read();
    await artworkCache.emptyCache();
  }

  // Deletes the copies of Steam artwork SRM kept before replacing it.
  async clearArtworkBackups() {
    await fs.remove(path.join(paths.userDataDir, "artworkBackups"));
  }

  // The JSON files in userData/User themes (validated by the UI, which
  // knows the theme tokens). Unreadable files come back with an error.
  async userThemes(): Promise<
    { file: string; data?: unknown; error?: string }[]
  > {
    if (!(await fs.pathExists(paths.userThemesDir))) {
      return [];
    }
    const files = (await fs.readdir(paths.userThemesDir))
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .sort();
    return Promise.all(
      files.map(async (file) => {
        try {
          const text = await fs.readFile(
            path.join(paths.userThemesDir, file),
            "utf8",
          );
          return { file, data: JSON.parse(text) };
        } catch (e) {
          return { file, error: String(e?.message ?? e) };
        }
      }),
    );
  }

  submitBugReport(report: BugReport): Promise<BugReportResult> {
    return submitBugReport(this.fetch, report);
  }

  // What a text field shows for a path picked with "browse": optionally with
  // forward slashes and glob-escaped, and with `appendGlob` (or the field's
  // current last segment) appended.
  browsedValue(
    selectedPath: string,
    currentValue: string | null,
    options: { appendGlob?: string; useForwardSlash?: boolean },
  ): string {
    const { appendGlob, useForwardSlash } = options;
    if (!appendGlob && !useForwardSlash) {
      return selectedPath;
    }
    const escaped = escape(selectedPath.replaceAll("\\", "/"));
    if (!appendGlob) {
      return escaped;
    }
    // Keep the escaping backslashes through path.resolve.
    const swapString = "$:$:$";
    const resolved = path.resolve(
      escaped.replaceAll("\\", swapString),
      currentValue ? path.basename(currentValue) : appendGlob,
    );
    return resolved.replaceAll("\\", "/").replaceAll(swapString, "\\");
  }
}
