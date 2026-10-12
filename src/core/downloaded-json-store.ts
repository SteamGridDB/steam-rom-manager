import * as path from "path";
import { Logger } from "../models";
import * as json from "../lib/helpers/json";
import { Fetch, getJson } from "./http";

const treesURL =
  "https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/";
const rawURL =
  "https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/";

// Raw-content URLs of the files directly inside `dir` of the SRM repository
// at `ref` (a branch or commit), by repository path.
export async function listRepoDir(
  fetch: Fetch,
  ref: string,
  dir: string,
): Promise<{ path: string; url: string }[]> {
  const tree = await getJson(fetch, `${treesURL}${ref}?recursive=1`);
  return tree.tree
    .filter((entry: any) => path.posix.dirname(entry.path) == dir)
    .map((entry: any) => ({
      path: entry.path,
      url: `${rawURL}${ref}/${entry.path
        .split("/")
        .map((x: string) => encodeURI(x))
        .join("/")}`,
    }));
}

// Fetches every JSON file directly inside `dir` of the SRM repository at
// `ref` and merges them into one object.
export async function downloadRepoDir(
  fetch: Fetch,
  ref: string,
  dir: string,
): Promise<object> {
  const parts: object[] = [];
  for (const file of await listRepoDir(fetch, ref, dir)) {
    parts.push(await getJson(fetch, file.url));
  }
  return Object.assign({}, ...parts);
}

type Listener<T> = (data: T) => void;

// A JSON collection SRM ships in its repository (presets, custom variables):
// refreshed from GitHub on load and cached in userData so it also works
// offline. A failed download is reported but never prevents using the cache.
export abstract class DownloadedJsonStore<T extends object> {
  private data: T = {} as T;
  private downloading = false;
  private listeners = new Set<Listener<T>>();
  private downloadingListeners = new Set<Listener<boolean>>();
  // Set when the local cache is unusable, so it isn't overwritten.
  savingIsDisabled = false;

  constructor(
    protected logger: Logger,
    protected fetch: Fetch,
    private validator: json.Validator,
  ) {}

  protected abstract get localFile(): string;
  protected abstract get lang(): {
    info: { downloaded: string };
    error: {
      loadingError: string;
      writingError: string;
      failedToDownload__i: string;
      corruptedVariables__i: string;
    };
  };
  // Repository folder holding the files, and the ref to fetch them from.
  protected abstract get repoDir(): string;
  protected abstract downloadRef(): Promise<string>;
  // Final data from the cache file's contents (e.g. merged with user data).
  protected async fromCache(cached: T | null): Promise<T> {
    return cached || ({} as T);
  }

  get(): T {
    return this.data;
  }

  get isDownloading() {
    return this.downloading;
  }

  onChange(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onDownloadingChange(listener: Listener<boolean>): () => void {
    this.downloadingListeners.add(listener);
    return () => this.downloadingListeners.delete(listener);
  }

  private setDownloading(downloading: boolean) {
    this.downloading = downloading;
    for (const listener of this.downloadingListeners) {
      listener(downloading);
    }
  }

  // Validates and (if valid) publishes `data`; returns an error if invalid.
  set(data: T): string | null {
    if (this.validator.validate(data).isValid()) {
      this.data = data;
      for (const listener of this.listeners) {
        listener(data);
      }
      return null;
    }
    return `\r\n${this.validator.errorString}`;
  }

  // Refreshes from GitHub and caches the result. Failures are logged; the
  // current data is kept.
  async download(force: boolean = false): Promise<void> {
    if (this.downloading) {
      return;
    }
    this.setDownloading(true);
    let ref = "";
    try {
      ref = await this.downloadRef();
      const downloaded = (await downloadRepoDir(
        this.fetch,
        ref,
        this.repoDir,
      )) as T;
      const error = this.set(downloaded);
      if (error) {
        this.logger.error(
          this.lang.error.failedToDownload__i.interpolate({
            error,
            commit: ref,
          }),
        );
      } else {
        this.logger.info(
          this.lang.info.downloaded,
          force ? { invokeAlert: true, alertTimeout: 5000 } : undefined,
        );
        await this.save(force);
      }
    } catch (error) {
      this.logger.error(
        this.lang.error.failedToDownload__i.interpolate({
          error,
          commit: ref || "?",
        }),
        force ? { invokeAlert: true, alertTimeout: 5000 } : undefined,
      );
    } finally {
      this.setDownloading(false);
    }
  }

  // Refreshes from GitHub if possible, then loads from the local cache.
  async load(): Promise<T> {
    await this.download();
    try {
      const cached = await json.read<T>(this.localFile);
      const error = this.set(await this.fromCache(cached));
      if (error !== null) {
        this.savingIsDisabled = true;
        this.logger.error(this.lang.error.loadingError, {
          invokeAlert: true,
          alertTimeout: 5000,
          doNotAppendToLog: true,
        });
        this.logger.error(
          this.lang.error.corruptedVariables__i.interpolate({
            file: this.localFile,
            error,
          }),
        );
      }
    } catch (error) {
      this.savingIsDisabled = true;
      this.logger.error(this.lang.error.loadingError, {
        invokeAlert: true,
        alertTimeout: 5000,
        doNotAppendToLog: true,
      });
      this.logger.error(error);
    }
    return this.data;
  }

  async save(force: boolean = false): Promise<void> {
    if (this.savingIsDisabled && !force) {
      return;
    }
    try {
      await json.write(this.localFile, this.data);
    } catch (error) {
      this.logger.error(this.lang.error.writingError, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(error);
    }
  }
}
