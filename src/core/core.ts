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
  readonly preview: PreviewEngine;

  constructor({ logger, fetch = getDefaultFetch(), onNewImage }: CoreOptions) {
    this.settings = new SettingsStore(logger);
    this.exceptions = new ExceptionsStore(logger);
    this.customVariables = new CustomVariablesStore(logger, fetch);
    this.presets = new PresetsStore(logger, fetch);
    this.fuzzy = new FuzzyStore(logger, this.settings, fetch);
    this.parsers = new ParsersStore(logger, this.settings, this.fuzzy);
    this.providers = new ArtworkProviders(fetch);
    this.preview = new PreviewEngine({
      logger,
      parsers: this.parsers,
      providers: this.providers,
      settings: this.settings,
      onNewImage,
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
  start({ presets = true }: { presets?: boolean } = {}) {
    if (this.ready) {
      return this.ready;
    }
    const settings = this.settings.load();
    this.ready = {
      settings,
      parsers: settings.then(() => this.parsers.load()),
      controllerTemplates: this.parsers.readControllerTemplates(),
      exceptions: this.exceptions.load(),
      customVariables: this.customVariables.load(),
      presets: presets ? this.presets.load() : Promise.resolve(),
      fuzzy: settings.then(() => this.fuzzy.load()),
    };
    return this.ready;
  }

  // Loads everything and waits for it (what the CLI needs before a run).
  async load(options: { presets?: boolean } = {}) {
    await Promise.all(Object.values(this.start(options)));
  }
}
