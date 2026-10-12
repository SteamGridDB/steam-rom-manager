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
    this.preview = new PreviewEngine(
      logger,
      this.parsers,
      this.providers,
      this.settings,
      onNewImage,
    );
    this.exceptions.onChange((saved) => this.parsers.setUserExceptions(saved));
    this.customVariables.onChange((variables) =>
      this.parsers.setCustomVariables(variables),
    );
  }

  // Loads all user data (settings first; everything else depends on them).
  // Parser presets are only needed by the parser editor.
  async load({ presets = true }: { presets?: boolean } = {}) {
    await this.settings.load();
    await Promise.all([
      this.exceptions.load(),
      this.customVariables.load(),
      this.fuzzy.load(),
      this.parsers.readControllerTemplates(),
      presets ? this.presets.load() : undefined,
    ]);
    await this.parsers.load();
  }
}
