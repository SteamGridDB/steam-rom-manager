import { ImageContent, Logger } from "../models";
import { Fetch, getDefaultFetch } from "./http";
import { SettingsStore } from "./settings-store";
import { ParsersStore } from "./parsers-store";
import { ExceptionsStore } from "./exceptions-store";
import { CustomVariablesStore } from "./custom-variables-store";
import { PresetsStore } from "./presets-store";
import { FuzzyStore } from "./fuzzy-store";
import { ArtworkProviders } from "./artwork-providers";
import { PreviewEngine } from "./preview-engine";
import { PreviewBuilder } from "./preview-builder";
import { SteamWriter } from "./steam-writer";
import { LibraryReader } from "./library-reader";
import { ShellScripts } from "./shell-scripts";
import { UiSupport } from "./ui-support";

export interface CoreOptions {
  logger: Logger;
  fetch?: Fetch;
  // See PreviewEngine: lets a UI preload new online images.
  onNewImage?: (image: ImageContent) => void;
}

// Everything SRM does, without a UI: one instance per process.
export class Core {
  readonly settings: SettingsStore;
  readonly parsers: ParsersStore;
  readonly exceptions: ExceptionsStore;
  readonly customVariables: CustomVariablesStore;
  readonly presets: PresetsStore;
  readonly fuzzy: FuzzyStore;
  readonly providers: ArtworkProviders;
  readonly builder: PreviewBuilder;
  readonly writer: SteamWriter;
  readonly preview: PreviewEngine;
  readonly library: LibraryReader;
  readonly shellScripts: ShellScripts;
  readonly support: UiSupport;

  constructor({ logger, fetch = getDefaultFetch(), onNewImage }: CoreOptions) {
    this.settings = new SettingsStore(logger);
    this.exceptions = new ExceptionsStore(logger);
    this.customVariables = new CustomVariablesStore(logger, fetch);
    this.presets = new PresetsStore(logger, fetch);
    this.fuzzy = new FuzzyStore(logger, this.settings, fetch);
    this.parsers = new ParsersStore(logger, this.settings, this.fuzzy);
    this.providers = new ArtworkProviders(fetch);
    this.builder = new PreviewBuilder(logger, this.parsers, this.settings);
    this.writer = new SteamWriter(logger, this.parsers, this.settings);
    this.library = new LibraryReader(logger, this.parsers);
    this.shellScripts = new ShellScripts(logger, fetch);
    this.support = new UiSupport(fetch);
    this.preview = new PreviewEngine({
      logger,
      parsers: this.parsers,
      providers: this.providers,
      settings: this.settings,
      onNewImage,
      builder: this.builder,
      writer: this.writer,
    });
    this.exceptions.onChange((saved) => this.parsers.setUserExceptions(saved));
    this.customVariables.onChange((variables) =>
      this.parsers.setCustomVariables(variables),
    );
  }

  // Per-store readiness, set by start(): lets a UI show what's loaded while
  // downloads (presets, custom variables, fuzzy list) are still running.
  ready: {
    settings: Promise<unknown>;
    parsers: Promise<unknown>;
    controllerTemplates: Promise<unknown>;
    exceptions: Promise<unknown>;
    customVariables: Promise<unknown>;
    presets: Promise<unknown>;
    fuzzy: Promise<unknown>;
  };

  // Starts loading all user data. Settings come first for the stores that
  // depend on them. Parser presets are only needed by the parser editor.
  // Without `refresh` (the CLI), the cached downloads are used as they are:
  // the network is only needed when there's no cache yet.
  start({
    presets = true,
    refresh = true,
  }: { presets?: boolean; refresh?: boolean } = {}) {
    if (this.ready) {
      return this.ready;
    }
    const settings = this.settings.load();
    // Offline mode: no downloads (the cached copies are used).
    const download = () => ({
      download: this.settings.get().offlineMode
        ? false
        : refresh || ("if-missing" as const),
    });
    this.ready = {
      settings,
      parsers: settings.then(() => this.parsers.load()),
      controllerTemplates: this.parsers.readControllerTemplates(),
      exceptions: this.exceptions.load(),
      customVariables: settings.then(() =>
        this.customVariables.load(download()),
      ),
      presets: presets
        ? settings.then(() => this.presets.load(download()))
        : Promise.resolve(),
      fuzzy: settings.then(() =>
        this.fuzzy.load({ refresh: download().download }),
      ),
    };
    return this.ready;
  }

  // Loads everything and waits for it (what the CLI needs before a run).
  async load(options: { presets?: boolean; refresh?: boolean } = {}) {
    await Promise.all(Object.values(this.start(options)));
  }
}
