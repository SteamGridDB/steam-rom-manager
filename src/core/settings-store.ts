import { AppSettings, Logger } from "../models";
import { APP, languageManager } from "../variables";
import * as json from "../lib/helpers/json";
import * as paths from "../paths";
import * as schemas from "./schemas";
import * as modifiers from "./modifiers";

type Listener = (settings: AppSettings) => void;

// userSettings.json: load (with migrations), validate, save.
//
// get() returns the live settings object; callers may mutate it and then call
// save()/changed(), as the UI does.
export class SettingsStore {
  private validator = new json.Validator<AppSettings>(
    schemas.appSettings,
    modifiers.appSettings,
  );
  private settings: AppSettings = this.validator.getDefaultValues();
  private listeners = new Set<Listener>();
  // Set when the file on disk couldn't be used, so we never overwrite the
  // user's settings with defaults.
  savingIsDisabled = false;

  constructor(private logger: Logger) {}

  private get lang() {
    return APP.lang.settings.service;
  }

  async load(): Promise<AppSettings> {
    try {
      const settings = await json.read<AppSettings>(
        paths.userSettings,
        this.settings,
      );
      if (!this.validator.validate(settings).isValid()) {
        this.savingIsDisabled = true;
        this.logger.error(this.lang.error.readingError, {
          invokeAlert: true,
          alertTimeout: 5000,
          doNotAppendToLog: true,
        });
        this.logger.error(
          this.lang.error.corruptedSettings__i.interpolate({
            file: paths.userSettings,
            error: `\r\n${this.validator.errorString}`,
          }),
        );
      } else {
        this.settings = settings;
        this.applyLanguage();
      }
    } catch (error) {
      // Unreadable (e.g. not JSON): keep defaults but don't save over it.
      this.savingIsDisabled = true;
      this.logger.error(this.lang.error.readingError, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(error);
    }
    return this.settings;
  }

  get(): AppSettings {
    return this.settings;
  }

  async save(): Promise<void> {
    if (this.savingIsDisabled) {
      return;
    }
    try {
      await json.write(paths.userSettings, this.settings);
    } catch (error) {
      this.logger.error(this.lang.error.writingError, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.logger.error(error);
    }
  }

  // Replaces the settings with `data` (e.g. edited in a UI), keeping the
  // same object so other stores' references stay valid.
  async replace(
    data: AppSettings,
    { save = true, notify = false }: { save?: boolean; notify?: boolean } = {},
  ) {
    for (const key of Object.keys(this.settings)) {
      delete (this.settings as any)[key];
    }
    Object.assign(this.settings, data);
    this.applyLanguage();
    if (notify) {
      this.changed();
    }
    if (save) {
      await this.save();
    }
  }

  // Messages this process produces (e.g. the core's log) use the language
  // the user picked.
  private applyLanguage() {
    const language = this.settings.language;
    if (language && language !== this.appliedLanguage) {
      this.appliedLanguage = language;
      APP.lang = languageManager.getLanguage(language);
    }
  }
  private appliedLanguage: string;

  // Tell listeners the settings object changed (after in-place edits).
  changed() {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
