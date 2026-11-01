// Fakes for the Angular collaborators of the renderer services, so the real
// service classes can run in plain Node. Each fake records what was asked of
// it; nothing here touches the network or a real SRM/Steam install.
import { BehaviorSubject } from "rxjs";
import { FuzzyMatcher } from "../../src/lib/fuzzy-matcher";
import { AppSettings } from "../../src/models";
import { LogEntry } from "./preview-harness";

export function makeLogger() {
  const log: LogEntry[] = [];
  const record =
    (level: LogEntry["level"]) => (message: any, _options?: unknown) => {
      log.push({
        level,
        message: message instanceof Error ? message.message : String(message),
        stack: message instanceof Error ? message.stack : undefined,
      });
    };
  return {
    log,
    service: {
      info: record("info"),
      success: record("success"),
      error: record("error"),
    },
  };
}

// A settings store (and its SettingsService facade) over an in-memory
// settings object; records saves instead of writing userSettings.json.
export function makeSettingsService(settings: AppSettings) {
  const calls = { saves: 0, changes: 0 };
  const store = {
    get: () => settings,
    load: async () => settings,
    save: async () => {
      calls.saves++;
    },
    changed: () => {
      calls.changes++;
    },
    onChange: () => () => {},
    savingIsDisabled: false,
  };
  return {
    calls,
    store,
    service: {
      store,
      onLoad: (cb: (s: AppSettings) => void) => cb(settings),
      getSettings: () => settings,
      saveAppSettings: () => store.save(),
      settingsChanged: () => store.changed(),
    },
  };
}

export function makeFuzzyService(games: string[] = []) {
  return {
    fuzzyMatcher: new FuzzyMatcher(undefined, {
      totalGames: games.length,
      games,
    }),
  };
}

export function makeDataService<T>(value: T) {
  return { dataObservable: new BehaviorSubject<T>(value) };
}

// Resolves once a service's onLoad(callback) fires, or rejects on timeout so
// a load that never completes fails the test instead of hanging it.
export function loaded<T>(
  service: { onLoad: (cb: (value: T) => void) => void },
  timeoutMs = 2000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`onLoad did not fire within ${timeoutMs}ms`)),
      timeoutMs,
    );
    service.onLoad((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

// Cores keep loading (and saving, e.g. fuzzy list timestamps into
// userSettings.json) in the background. Tests sharing a userData folder must
// let one finish before the next test writes its files.
export function settleCoresAfterEach(
  afterEach: (fn: () => Promise<void>) => void,
) {
  const cores: { ready: Record<string, Promise<unknown>> }[] = [];
  afterEach(async () => {
    await Promise.all(
      cores.splice(0).map((core) => Promise.all(Object.values(core.ready))),
    );
  });
  return <T extends { ready: Record<string, Promise<unknown>> }>(core: T) => {
    cores.push(core);
    return core;
  };
}
