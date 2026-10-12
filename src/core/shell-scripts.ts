import * as fs from "fs-extra";
import * as path from "path";
import { Logger } from "../models";
import * as paths from "../paths";
import { Fetch } from "./http";
import { listRepoDir } from "./downloaded-json-store";

// Helper scripts some parsers run (e.g. bnet.ps1 for Battle.net), kept in
// userData/scripts and refreshed from files/shellscripts on GitHub master.
export class ShellScripts {
  private downloading = false;
  private downloadingListeners = new Set<(downloading: boolean) => void>();

  constructor(
    private logger: Logger,
    private fetch: Fetch,
  ) {}

  getDownloading() {
    return this.downloading;
  }

  onDownloadingChange(listener: (downloading: boolean) => void) {
    this.downloadingListeners.add(listener);
    return () => this.downloadingListeners.delete(listener);
  }

  private setDownloading(downloading: boolean) {
    this.downloading = downloading;
    for (const listener of this.downloadingListeners) listener(downloading);
  }

  async download() {
    if (this.downloading) {
      return;
    }
    this.setDownloading(true);
    try {
      const files = await listRepoDir(
        this.fetch,
        "master",
        "files/shellscripts",
      );
      const scriptsDir = path.join(paths.userDataDir, "scripts");
      await fs.ensureDir(scriptsDir);
      for (const file of files) {
        const res = await this.fetch(file.url, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${file.url}`);
        }
        await fs.writeFile(
          path.join(scriptsDir, path.posix.basename(file.path)),
          await res.text(),
        );
      }
      this.logger.info("Shell scripts have been updated.");
    } catch (e) {
      this.logger.error(`Could not update shell scripts: ${e?.message ?? e}`);
    } finally {
      this.setDownloading(false);
    }
  }
}
