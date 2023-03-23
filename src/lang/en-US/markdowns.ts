export const markdowns = {
  parsers: {
    component: {
      docs__md: {
        intro: [require('./markdown/intro.md')],
        faq: [require('./markdown/faq.md')],
        communityPresets: [require('./markdown/community-presets.md')],
        parserType: [require('./markdown/empty-parser-type.md')],
        configTitle: [require('./markdown/config-title.md')],
        steamCategory: [
          require('./markdown/steam-category.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md')
        ],
        controllerTemplates: [require('./markdown/controller-templates.md')],
        executableLocation: [require('./markdown/executable-location.md'),require('./markdown/parser-env-variables.md')],
        romDirectory: [require('./markdown/rom-directory.md'),require('./markdown/parser-env-variables.md')],
        steamDirectory: [require('./markdown/steam-directory.md'),require('./markdown/parser-env-variables.md')],
        startInDirectory: [require('./markdown/start-in-directory.md'),require('./markdown/parser-env-variables.md')],
        userAccounts: [require('./markdown/user-accounts.md')],
        titleModifier: [
          require('./markdown/title-modifier.md'),
          require('./markdown/what-is-app-id.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md')
        ],
        executableModifier: [
          require('./markdown/executable-modifier.md'),
          require('./markdown/what-is-app-id.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md')
        ],
        titleFromVariable: [
          require('./markdown/title-from-variable.md')
        ],
        fuzzyMatch: [require('./markdown/fuzzy-matching.md')],
        executableArgs: [
          require('./markdown/executable-arguments.md'),
          require('./markdown/what-is-app-id.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md')
        ],
        onlineImageQueries: [
          require('./markdown/online-image-queries.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md')
        ],
        imageProviders: [
          require('./markdown/image-providers.md'),
          require('./markdown/sgdb-api-input.md')
        ],
        imagePool: [
          require('./markdown/image-pool.md'),
        ],
        defaultImage: [
          require('./markdown/default-image.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        defaultTallImage: [
          require('./markdown/default-tall-image.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        defaultHeroImage: [
          require('./markdown/default-hero-image.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        defaultIcon: [
          require('./markdown/default-icon.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        defaultLogoImage: [
          require('./markdown/default-logo-image.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],

        localImages: [
          require('./markdown/local-images.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        localTallImages: [
          require('./markdown/local-tall-images.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        localHeroImages: [
          require('./markdown/local-hero-images.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],
        localLogoImages: [
          require('./markdown/local-logo-images.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ],

        localIcons: [
          require('./markdown/local-icons.md'),
          require('./markdown/special-glob-input.md'),
          require('./markdown/parser-variables.md'),
          require('./markdown/parser-env-variables.md'),
          require('./markdown/spec-glob-chars.md')
        ]
      }
    }
  },
  about: {
    component: {
      info__md: [require('./markdown/about.md')]
    }
  },
  logger: {
    component: {
      docs__md: {
        self: [require('./markdown/logger.md')]
      }
    }
  },
  settings: {
    component: {
      docs__md: {
        settings: [
          require('./markdown/settings.md'),
          require('./markdown/parser-env-variables.md')
        ]
      }
    }
  },
  userExceptions: {
    component: {
      docs__md: {
        userExceptions: [require('./markdown/user-exceptions.md')]
      }
    }
  },
  steamParser: {
    docs__md: {
      self: [
        require('./markdown/steam-parser.md')
      ]
    }
  },
  manualParser: {
    docs__md: {
      self: [
        require('./markdown/manual-parser.md'),
        require('./markdown/manual-parser-input.md')
      ],
      input: [
        require('./markdown/manual-parser-input.md')
      ]
    }
  },
  epicParser: {
    docs__md: {
      self: [
        require('./markdown/epic-parser.md'),
        require('./markdown/epic-parser-input.md')
      ],
      input: [
        require('./markdown/epic-parser-input.md')
      ]
    }
  },
  uplayParser: {
    docs__md: {
      self: [
        require('./markdown/uplay-parser.md'),
        require('./markdown/uplay-parser-input.md')
      ],
      input: [
        require('./markdown/uplay-parser-input.md')
      ]
    }
  },
  gogParser: {
    docs__md: {
      self: [
        require('./markdown/gog-parser.md'),
        require('./markdown/gog-parser-input.md')
      ],
      input: [
        require('./markdown/gog-parser-input.md')
      ]
    }
  },
  amazonGamesParser: {
    docs__md: {
      self: [
        require('./markdown/amazon-games-parser.md')
      ],
      input: [
        require('./markdown/amazon-games-parser-input.md')
      ]
    }
  },
  itchIoParser: {
    docs__md: {
      self: [
        require('./markdown/itch-io-parser.md')
      ],
      input: [
        require('./markdown/itch-io-parser-input.md')
      ]
    }
  },
  globParser: {
    docs__md: {
      self: [
        require('./markdown/glob-parser.md'),
        require('./markdown/what-is-glob.md'),
        require('./markdown/spec-glob-chars.md'),
      ],
      input: [
        require('./markdown/glob-parser-input.md'),
        require('./markdown/spec-glob-chars.md')
      ]
    }
  },
  globRegexParser: {
    docs__md: {
      self: [
        require('./markdown/glob-regex-parser.md'),
        require('./markdown/what-is-glob.md'),
        require('./markdown/spec-glob-chars.md')
      ],
      input: [
        require('./markdown/glob-regex-parser-input.md'),
        require('./markdown/spec-glob-chars.md')
      ]
    }
  },
  sgdbProvider: {
    docs__md: {
      self: [] as string[],
      input: [require('./markdown/sgdb-api-input.md')]
    }
  }
};
