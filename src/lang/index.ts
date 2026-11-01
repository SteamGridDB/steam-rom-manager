// The docs (markdown) shown in the UI, by where they appear. `load` reads a
// file from the language's markdown folder (falling back to en-US's).
export function markdownFor(load: (file: string) => string) {
  return {
    parsers: {
      component: {
        docs__md: {
          intro: [load("intro.md")],
          faq: [load("faq.md")],
          communityPresets: [load("community-presets.md")],
          parserType: [load("empty-parser-type.md")],
          configTitle: [load("config-title.md")],
          group: [load("group.md")],
          steamCategories: [load("steam-category.md")],
          controllerTemplates: [load("controller-templates.md")],
          executableLocation: [
            load("executable-location.md"),
            load("parser-env-variables.md"),
          ],
          romDirectory: [
            load("rom-directory.md"),
            load("parser-env-variables.md"),
          ],
          steamDirectory: [
            load("steam-directory.md"),
            load("parser-env-variables.md"),
          ],
          startInDirectory: [
            load("start-in-directory.md"),
            load("parser-env-variables.md"),
          ],
          userAccounts: [load("user-accounts.md")],
          titleModifier: [
            load("title-modifier.md"),
            load("what-is-app-id.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
          ],
          executableModifier: [
            load("executable-modifier.md"),
            load("what-is-app-id.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
          ],
          titleFromVariable: [load("title-from-variable.md")],
          sortAsFromVariable: [load("title-from-variable.md")],
          fuzzyMatch: [load("fuzzy-matching.md")],
          executableArgs: [
            load("executable-arguments.md"),
            load("what-is-app-id.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
          ],
          onlineImageQueries: [
            load("online-image-queries.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
          ],
          imageProviders: [
            load("image-providers.md"),
            load("sgdb-api-input.md"),
          ],
          imagePool: [
            load("image-pool.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
          ],
          overlayImages: [
            load("overlay-images.md"),
            load("parser-env-variables.md"),
          ],
          defaultImage: [
            load("default-image.md"),
            load("parser-env-variables.md"),
          ],
          localImages: [
            load("local-images.md"),
            load("special-glob-input.md"),
            load("parser-variables.md"),
            load("parser-env-variables.md"),
            load("spec-glob-chars.md"),
          ],
        },
      },
    },
    about: {
      component: {
        info__md: [load("about.md")],
      },
    },
    parsersList: {
      component: {
        info__md: [load("parsers-list.md")],
      },
    },
    logger: {
      component: {
        docs__md: {
          self: [load("logger.md")],
        },
      },
    },
    settings: {
      component: {
        docs__md: {
          settings: [load("settings.md"), load("parser-env-variables.md")],
        },
      },
    },
    userExceptions: {
      component: {
        docs__md: {
          userExceptions: [load("user-exceptions.md")],
        },
      },
    },
    steamParser: {
      docs__md: {
        self: [load("steam-parser.md"), load("steam-parser-input.md")],
        input: [load("steam-parser-input.md")],
      },
    },
    nonSRMShortcutsParser: {
      docs__md: {
        self: [load("non-srm-shortcuts-parser.md")],
        input: [] as string[],
      },
    },
    manualParser: {
      docs__md: {
        self: [load("manual-parser.md"), load("manual-parser-input.md")],
        input: [load("manual-parser-input.md")],
      },
    },
    githubLauncherParser: {
      docs__md: {
        self: [
          load("github-launcher-parser.md"),
          load("github-launcher-parser-input.md"),
        ],
        input: [load("github-launcher-parser-input.md")],
      },
    },
    quiverLauncherParser: {
      docs__md: {
        self: [
          load("quiver-launcher-parser.md"),
          load("quiver-launcher-parser-input.md"),
        ],
        input: [load("quiver-launcher-parser-input.md")],
      },
    },
    epicParser: {
      docs__md: {
        self: [load("epic-parser.md"), load("epic-parser-input.md")],
        input: [load("epic-parser-input.md")],
      },
    },
    legendaryParser: {
      docs__md: {
        self: [load("legendary-parser.md"), load("legendary-parser-input.md")],
        input: [load("legendary-parser-input.md")],
      },
    },
    UWPParser: {
      docs__md: {
        self: [load("UWP-parser.md"), load("UWP-parser-input.md")],
        input: [load("UWP-parser-input.md")],
      },
    },
    battleNetParser: {
      docs__md: {
        self: [
          load("battle-net-parser.md"),
          load("battle-net-parser-input.md"),
        ],
        input: [load("battle-net-parser-input.md")],
      },
    },
    uplayParser: {
      docs__md: {
        self: [load("uplay-parser.md"), load("uplay-parser-input.md")],
        input: [load("uplay-parser-input.md")],
      },
    },
    gogParser: {
      docs__md: {
        self: [load("gog-parser.md"), load("gog-parser-input.md")],
        input: [load("gog-parser-input.md")],
      },
    },
    amazonGamesParser: {
      docs__md: {
        self: [
          load("amazon-games-parser.md"),
          load("amazon-games-parser-input.md"),
        ],
        input: [load("amazon-games-parser-input.md")],
      },
    },
    itchIoParser: {
      docs__md: {
        self: [load("itch-io-parser.md"), load("itch-io-parser-input.md")],
        input: [load("itch-io-parser-input.md")],
      },
    },
    globParser: {
      docs__md: {
        self: [
          load("glob-parser.md"),
          load("what-is-glob.md"),
          load("spec-glob-chars.md"),
        ],
        input: [load("glob-parser-input.md"), load("spec-glob-chars.md")],
      },
    },
    globRegexParser: {
      docs__md: {
        self: [
          load("glob-regex-parser.md"),
          load("what-is-glob.md"),
          load("spec-glob-chars.md"),
        ],
        input: [load("glob-regex-parser-input.md"), load("spec-glob-chars.md")],
      },
    },
    eaDesktopParser: {
      docs__md: {
        self: [
          load("ea-desktop-parser.md"),
          load("ea-desktop-parser-input.md"),
        ],
        input: [load("ea-desktop-parser-input.md")],
      },
    },
    sgdbProvider: {
      docs__md: {
        self: [] as string[],
        input: [load("sgdb-api-input.md")],
      },
    },
  };
}

// Every language SRM ships (BCP 47 codes). en-US is the reference: the others
// fall back to it for anything they lack (see lib/lang-conform.ts).
export const languageCodes = [
  "en-US",
  "af-ZA",
  "ar-SA",
  "ca-ES",
  "cs-CZ",
  "da-DK",
  "de-DE",
  "el-GR",
  "es-419",
  "es-ES",
  "fi-FI",
  "fr-FR",
  "he-IL",
  "hu-HU",
  "it-IT",
  "ja-JP",
  "ko-KR",
  "nl-NL",
  "no-NO",
  "pl-PL",
  "pt-BR",
  "pt-PT",
  "ro-RO",
  "ru-RU",
  "sr-SP",
  "sv-SE",
  "tr-TR",
  "uk-UA",
  "vi-VN",
  "zh-CN",
  "zh-TW",
] as const;

export type LanguageCode = (typeof languageCodes)[number];

// A language's raw files: its langStrings.json, and its markdown files by
// name (undefined when it has no translation of one). The require()s are
// webpack contexts in the app, plain requires in tests.
export function languageFiles(code: LanguageCode) {
  return {
    langStrings: require(`./${code}/langStrings.json`) as unknown,
    markdown(file: string): string | undefined {
      try {
        return require(`./${code}/markdown/${file}`);
      } catch (e) {
        return undefined;
      }
    },
  };
}
