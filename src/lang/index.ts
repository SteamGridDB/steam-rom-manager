function getMarkdown(langPath: string) {
  return {
    parsers: {
      component: {
        docs__md: {
          intro: [require(`${langPath}/intro.md`)],
          faq: [require(`${langPath}/faq.md`)],
          communityPresets: [require(`${langPath}/community-presets.md`)],
          parserType: [require(`${langPath}/empty-parser-type.md`)],
          configTitle: [require(`${langPath}/config-title.md`)],
          steamCategory: [
            require(`${langPath}/steam-category.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`)
          ],
          controllerTemplates: [require(`${langPath}/controller-templates.md`)],
          executableLocation: [
            require(`${langPath}/executable-location.md`),
            require(`${langPath}/parser-env-variables.md`)],
          romDirectory: [
            require(`${langPath}/rom-directory.md`),
            require(`${langPath}/parser-env-variables.md`)],
          steamDirectory: [
            require(`${langPath}/steam-directory.md`),
            require(`${langPath}/parser-env-variables.md`)],
          startInDirectory: [
            require(`${langPath}/start-in-directory.md`),
            require(`${langPath}/parser-env-variables.md`)],
          userAccounts: [require(`${langPath}/user-accounts.md`)],
          titleModifier: [
            require(`${langPath}/title-modifier.md`),
            require(`${langPath}/what-is-app-id.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`)
          ],
          executableModifier: [
            require(`${langPath}/executable-modifier.md`),
            require(`${langPath}/what-is-app-id.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`)
          ],
          titleFromVariable: [
            require(`${langPath}/title-from-variable.md`)
          ],
          fuzzyMatch: [require(`${langPath}/fuzzy-matching.md`)],
          executableArgs: [
            require(`${langPath}/executable-arguments.md`),
            require(`${langPath}/what-is-app-id.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`)
          ],
          onlineImageQueries: [
            require(`${langPath}/online-image-queries.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`)
          ],
          imageProviders: [
            require(`${langPath}/image-providers.md`),
            require(`${langPath}/sgdb-api-input.md`)
          ],
          imagePool: [
            require(`${langPath}/image-pool.md`),
          ],
          defaultImage: [
            require(`${langPath}/default-image.md`),
            require(`${langPath}/parser-env-variables.md`),
          ],
          localImages: [
            require(`${langPath}/local-images.md`),
            require(`${langPath}/special-glob-input.md`),
            require(`${langPath}/parser-variables.md`),
            require(`${langPath}/parser-env-variables.md`),
            require(`${langPath}/spec-glob-chars.md`)
          ]
        }
      }
    },
    about: {
      component: {
        info__md: [require(`${langPath}/about.md`)]
      }
    },
    parsersList: {
      component: {
        info__md: [require(`${langPath}/parsers-list.md`)]
      }
    },
    logger: {
      component: {
        docs__md: {
          self: [require(`${langPath}/logger.md`)]
        }
      }
    },
    settings: {
      component: {
        docs__md: {
          settings: [
            require(`${langPath}/settings.md`),
            require(`${langPath}/parser-env-variables.md`)
          ]
        }
      }
    },
    userExceptions: {
      component: {
        docs__md: {
          userExceptions: [require(`${langPath}/user-exceptions.md`)]
        }
      }
    },
    steamParser: {
      docs__md: {
        self: [
          require(`${langPath}/steam-parser.md`)
        ],
        input: [
          require(`${langPath}/steam-parser-input.md`)
        ]
      }
    },
    manualParser: {
      docs__md: {
        self: [
          require(`${langPath}/manual-parser.md`),
          require(`${langPath}/manual-parser-input.md`)
        ],
        input: [
          require(`${langPath}/manual-parser-input.md`)
        ]
      }
    },
    epicParser: {
      docs__md: {
        self: [
          require(`${langPath}/epic-parser.md`),
          require(`${langPath}/epic-parser-input.md`)
        ],
        input: [
          require(`${langPath}/epic-parser-input.md`)
        ]
      }
    },
    legendaryParser: {
      docs__md: {
        self: [
          require(`${langPath}/legendary-parser.md`),
          require(`${langPath}/legendary-parser-input.md`)
        ],
        input: [
          require(`${langPath}/legendary-parser-input.md`)
        ]
      }
    },
    UWPParser: {
      docs__md: {
        self: [
          require(`${langPath}/UWP-parser.md`),
          require(`${langPath}/UWP-parser-input.md`)
        ],
        input: [
          require(`${langPath}/UWP-parser-input.md`)
        ]
      }
    },
    battleNetParser: {
      docs__md: {
        self: [
          require(`${langPath}/battle-net-parser.md`),
          require(`${langPath}/battle-net-parser-input.md`)
        ],
        input: [
          require(`${langPath}/battle-net-parser-input.md`)
        ]
      }
    },
    uplayParser: {
      docs__md: {
        self: [
          require(`${langPath}/uplay-parser.md`),
          require(`${langPath}/uplay-parser-input.md`)
        ],
        input: [
          require(`${langPath}/uplay-parser-input.md`)
        ]
      }
    },
    gogParser: {
      docs__md: {
        self: [
          require(`${langPath}/gog-parser.md`),
          require(`${langPath}/gog-parser-input.md`)
        ],
        input: [
          require(`${langPath}/gog-parser-input.md`)
        ]
      }
    },
    amazonGamesParser: {
      docs__md: {
        self: [
          require(`${langPath}/amazon-games-parser.md`),
          require(`${langPath}/amazon-games-parser-input.md`)
        ],
        input: [
          require(`${langPath}/amazon-games-parser-input.md`)
        ]
      }
    },
    itchIoParser: {
      docs__md: {
        self: [
          require(`${langPath}/itch-io-parser.md`),
          require(`${langPath}/itch-io-parser-input.md`)
        ],
        input: [
          require(`${langPath}/itch-io-parser-input.md`)
        ]
      }
    },
    globParser: {
      docs__md: {
        self: [
          require(`${langPath}/glob-parser.md`),
          require(`${langPath}/what-is-glob.md`),
          require(`${langPath}/spec-glob-chars.md`),
        ],
        input: [
          require(`${langPath}/glob-parser-input.md`),
          require(`${langPath}/spec-glob-chars.md`)
        ]
      }
    },
    globRegexParser: {
      docs__md: {
        self: [
          require(`${langPath}/glob-regex-parser.md`),
          require(`${langPath}/what-is-glob.md`),
          require(`${langPath}/spec-glob-chars.md`)
        ],
        input: [
          require(`${langPath}/glob-regex-parser-input.md`),
          require(`${langPath}/spec-glob-chars.md`)
        ]
      }
    },
    eaDesktopParser: {
      docs__md: {
        self: [
          require(`${langPath}/ea-desktop-parser.md`),
          require(`${langPath}/ea-desktop-parser-input.md`)
        ],
        input: [
          require(`${langPath}/ea-desktop-parser-input.md`)
        ]
      }
    },
    sgdbProvider: {
      docs__md: {
        self: [] as string[],
        input: [require(`${langPath}/sgdb-api-input.md`)]
      }
    }
  };
}

// Make sure everything is exported as BCP 47 compatible codes
// let enabledLanguages = ['en-US'].concat(['nl-NL', 'pt-BR','fr-FR','de-DE','zh-CN'].sort());
let enabledLanguages = ['en-US'];
let langData = Object.fromEntries(enabledLanguages.map(x=>[x,{
  langStrings: require(`./${x}/langStrings.json`),
  markdowns: getMarkdown(`./${x}/markdown`)
}]))

export default langData;
