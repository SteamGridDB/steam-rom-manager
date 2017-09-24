import { languageContainer } from "../../models";

export const EnglishLang: languageContainer = {
    'Français': {
        preview: {
            component: {
                filter: 'Filtrer les titres des jeux',
                from: 'De',
                by: 'par',
                refresh: 'Rafraîchir',
                retrievingUrls: 'Récupération des URLs',
                noImages: 'Aucune image n'est disponible',
                downloadFailed: 'Le téléchargement a échoué. Cliquez pour réessayer',
                downloadingImage: 'Téléchargement de l'image',
                generateAppList: 'Générer une liste',
                saveAppList: 'Sauvegarder la liste',
                removeAppList: 'Supprimer la liste',
                remainingImages: 'Fournisseur restant:',
                stopUrlRetrieving: 'Arrêter les fournisseurs d'images restant'
            },
            service: {
                info: {
                    listIsBeingGenerated: 'La liste est en cours de génération. S'il vous plaît, attendez.',
                    listIsBeingSaved: 'La liste est en cours de sauvegarde. S'il vous plaît, attendez.',
                    listIsBeingRemoved: 'La liste est en cours de suppression. S'il vous plaît, attendez.',
                    listIsEmpty: 'La liste est vide.',
                    populatingVDF_List: 'Remplissage de la liste VDF.',
                    creatingBackups: 'Création de sauvegardes.',
                    readingVDF_Files: 'Lecture des fichiers VDF.',
                    mergingVDF_entries: 'Fusion des entrées VDF et remplacement des fichiers image.',
                    removingVDF_entries: 'Suppression des entrées VDF et des fichiers d'image.',
                    writingVDF_entries: 'Ecriture de fichiers VDF.',
                    updatingKnownSteamDirList: 'Mise à jour d'une liste des répertoires Steam connus.',
                    retryingDownload__i: 'Réessayer de télécharger l'image depuis "${imageUrl}" pour "${appTitle}".',
                    disabledConfigurations__i: '${count} la (les) configuration (s) utilisateur (s) a (ont) été ignorée (s) (désactivée (s) par l'utilisateur.',
                    invalidConfigurations__i: '${count} la (les) configuration (s) utilisateur (s) a/ont été ignorée (s) (invalide (s)).',
                    executingParsers: 'Exécution des analyseurs.',
                    shutdownSteam: 'Veuillez éteindre Steam avant de sauvegarder, sinon l'enregistrement risque de ne pas être correct.',
                    noParserConfigurations: 'Veuillez d'abord créer la configuration de l'analyseur dans le menu "Analyseurs".',
                    parserFoundNoFiles: 'Les analyseurs n'ont trouvé aucun fichier correspondant à la configuration de l'utilisateur.',
                    allImagesRetrieved: 'Toutes les urls d'images disponibles sont récupérées.',
                    providerTimeout__i: 'Le délai d'attente a été demandé par "${provider}" pour ${time} seconde (s).'
                },
                errors: {
                    mergingVDF_entries: 'Des erreurs sont survenues lors de la fusion de fichiers VDF ou du téléchargement d'images.',
                    readingVDF_entries: 'Des erreurs sont survenues lors de la lecture des fichiers VDF.',
                    fatalError: 'Une erreur fatale s'est produite. Voir le Log des événements pour plus de détails.',
                    knownSteamDirListIsEmpty: 'Une liste des répertoires Steam connus est vide.',
                    retryingDownload__i: 'Le téléchargement de l'image depuis "${imageUrl}" a échoué pour "${appTitle}".',
                    providerError__i: 'Erreur reçue de "${fournisseur}" pour "${title}" (${url? {code}: ${url}`: code}).',
                    unknownProviderError__i: 'Erreur inconnue reçue de "${fournisseur}" pour "${title}": ${error} "${fournisseur}".'
                },
                success: {
                    writingVDF_entries: 'Nouvelles entrées sauvegardées/ajoutées.',
                    removingVDF_entries: 'Les entrées ont été supprimées.',
                }
            }
        },
        globParser: {
            title: 'Glob',
            inputTitle: 'User\'s glob',
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
            },
            errors: {
                noTitle: 'File glob must contain ${title}!',
                moreThanOneTitle: 'Le fichier glob ne doit contenir qu'un seul ${title}!',
                noStarNextToTitle: 'Star (*) ne peut pas être à côté de ${title}!',
                noAnyCharNextToTitle: 'Un char (?) ne peut pas être à côté de ${title}!',
                noWindowsSlash: 'Le caractère de répertoire Windows (\\\) n'est pas autorisé! Utilisez "/" à la place.',
                noGlobstarOnBothSides: 'Globstar (**) ne peut être que sur un côté de ${title}!',
                noBracedDirSetOnBothSides: 'Un ensemble contreventé, contenant au moins une barre oblique (/) ne peut être que sur un côté de ${title}!',
                noBracedDirSetOrGlobstarOnBothSides: 'Un set contreventé, contenant au moins une barre oblique (/) et un globstar (**) ne peut être que sur un côté de ${title}!',
                noEmptyPattern: 'Pattern ne peut pas être vide!',
                noEmptyCharRange: 'La plage de caractères ne peut pas être vide!',
                noStarInPatternNextToTitle: 'Star (*), à l'intérieur d'un motif, ne peut pas être à côté de ${title}!',
                noAnyCharInPatternNextToTitle: 'Un char (?), à l'intérieur d'un motif, ne peut pas être à côté de ${title}!'
            }
        },
        globRegexParser: {
            title: 'Glob-regex',
            inputTitle: 'User\'s glob-regex',
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
            },
            errors: {
                noRegex: 'Le fichier glob doit contenir ${regex} où "regex" est votre expression régulière!',
                moreThanOneRegex: 'Le fichier glob ne doit contenir qu'un seul ${regex}!',
                noStarNextToRegex: 'Star (*) ne peut pas être à côté de ${regex}!',
                noAnyCharNextToRegex: 'Un char (?) ne peut pas être à côté de ${regex}!',
                noWindowsSlash: 'Le caractère de répertoire Windows (\\\) n'est pas autorisé! Utilisez "/" à la place.',
                noGlobstarOnBothSides: 'Globstar (**) ne peut être que sur un côté de ${regex}!',
                noBracedDirSetOnBothSides: 'Un ensemble contreventé, contenant au moins une barre oblique (/) ne peut être que sur un côté de ${regex}!',
                noBracedDirSetOrGlobstarOnBothSides: 'Un set contreventé, contenant au moins une barre oblique (/) et un globstar (**) ne peut être que sur un côté de ${regex}!',
                noEmptyPattern: 'Pattern ne peut pas être vide!',
                noEmptyCharRange: 'La plage de caractères ne peut pas être vide!',
                noStarInPatternNextToRegex: 'Star (*), à l'intérieur d'un motif, ne peut pas être à côté de ${regex}!',
                noAnyCharInPatternNextToRegex: 'Un char (?), à l'intérieur d'un motif, ne peut pas être à côté de ${regex}!'
            }
        },
        logger: {
            component: {
                noMessages: 'Aucun message n'est disponible',
                error: 'ERREUR',
                info: 'INFO',
                success: 'SUCCÈS',
                fuzzy: 'FUZZY',
                timestamp: 'TEMPS TAMPON',
                textWrap: 'TEXT-WRAP',
                autoscroll: 'AUTOSCROLL',
                clearLog: 'Vider le Log'
            }
        },
        settings: {
            component: {
                label: {
                    general: 'Vider le log',
                    imageProviders: 'Paramètres du fournisseur d'images',
                    fuzzy: 'Réglages flous du comparateur'
                },
                text: {
                    offlineMode: 'Mode hors ligne',
                    removeApps_desc: 'Supprimez toutes les entrées ajoutées à l'application:',
                    removeApps_btn: 'Supprimer!",
                    preloadImages: 'Préchargement immédiat des images récupérées',
                    fuzzy_verbose: 'Enregistrement des résultats de la recherche (les résultats enregistrés sont masqués par défaut dans le log des événements)',
                    fuzzy_filter: 'Filtrer les images (essaye de filtrer les images non apparentées renvoyées par certains fournisseurs d'images)',
                    enabledProviders: 'Fournisseurs habilités:',
                    selectLanguage: 'Sélectionner la langue:'
                },
                placeholder: {
                    noProviders: 'Aucune'
                }
            },
            service: {
                error: {
                    writingError: 'Une erreur s'est produite lors de la sauvegarde des paramètres utilisateur.',
                    readingError: 'Une erreur s'est produite lors de la lecture des paramètres utilisateur.'
                }
            }
        },
        nav: {
            component: {
                preview: 'Prévisualisation',
                logger: 'Log des événements',
                settings: 'Réglages',
                parsers: 'Analyseurs',
                noTitle: 'Pas de titre!'
            }
        },
        parsers: {
            component: {
                buttons: {
                    save: 'Sauvegarder',
                    copy: 'Copier',
                    testParser: 'Analyseur de test',
                    delete: 'Supprimer',
                    moveUp: 'Déplacer vers le haut',
                    moveDown: 'Déplacer vers le bas',
                    faq: 'FAQ'
                },
                docs__md: {
                    intro: [require('./markdown/intro.md')],
                    faq: [require('./markdown/faq.md')],
                    parserType: [require('./markdown/empty-parser-type.md')],
                    configTitle: [require('./markdown/config-title.md')],
                    steamCategory: [require('./markdown/steam-category.md')],
                    executableLocation: [require('./markdown/executable-location.md')],
                    romDirectory: [require('./markdown/rom-directory.md')],
                    steamDirectory: [require('./markdown/steam-directory.md')],
                    userAccounts: [require('./markdown/user-accounts.md')],
                    titleModifier: [
                        require('./markdown/title-modifier.md'),
                        require('./markdown/what-is-app-id.md')
                    ],
                    fuzzyMatch: [require('./markdown/fuzzy-matching.md')],
                    executableArgs: [
                        require('./markdown/executable-arguments.md'),
                        require('./markdown/what-is-app-id.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    onlineImageQueries: [
                        require('./markdown/online-image-queries.md'),
                        require('./markdown/parser-variables.md')
                    ],
                    imageProviders: [
                        require('./markdown/image-providers.md')
                    ],
                    localImages: [
                        require('./markdown/local-images.md'),
                        require('./markdown/parser-variables.md'),
                        require('./markdown/spec-glob-chars.md')
                    ]
                },
                info: {
                    testStarting__i: 'Test de l'analyseur "${title}".',
                    testCompleted: 'Le test Analyseur est terminé.',
                    nothingWasFound: 'Analyseur n' a rien trouvé.'
                },
                error: {
                    missingAccounts__i: 'Après ${compte}, le (s) compte (s) utilisateur (s) n'ont pas été trouvé (s) (il faut se connecter à Steam au moins une fois).',
                    missingAccountInfo__i: '  ${name}',
                    failedToMatch: 'Incomparable:',
                    failedFileInfo__i: '[${index}/${total}]: ${filename}',
                    testFailed: 'Essai échoué',
                    cannotTestInvalid: 'Ne peut pas tester une configuration invalide!'
                },
                success: {
                    foundAccounts__i: 'Found ${count} available user account(s):',
                    foundAccountInfo__i: '  ${name} (steamID64: ${steamID64}, accountID: ${accountID})',
                    steamCategoriesResolved: 'Resolved Steam categories:',
                    steamCategoryInfo__i: '  ${steamCategory}',
                    extractedTitle__i: '[${index}/${total}]:               Titre - ${title}',
                    fuzzyTitle__i: '[${index}/${total}]:         Titre Fuzzy - ${title}',
                    filePath__i: '[${index}/${total}]:           Chemin du fichier - ${filePath}',
                    completeShortcut__i: '[${index}/${total}]:   Raccourci complet - ${shortcut}',
                    firstImageQuery__i: '[${index}/${total}]:       Requêtes d'images - ${query}',
                    imageQueries__i: '[${index}/${total}]:                       ${query}',
                    resolvedImageGlob__i: '[${index}/${total}]: Glob des Images résolues  - ${glob}',
                    localImagesResolved__i: '[${index}/${total}]:    Images résolues:',
                    localImageInfo__i: '[${index}/${total}]:    Images - ${image}'
                },
                label: {
                    parserType: 'Type d'analyseur',
                    configTitle: 'Titre de la configuration',
                    steamCategory: 'Catégorie de Steam',
                    executableLocation: 'Exécutable',
                    romDirectory: 'Répertoire ROMs',
                    steamDirectory: 'Répertoire Steam',
                    userAccounts: 'Comptes utilisateurs',
                    titleModifier: 'Modificateur de titre',
                    fuzzyMatch: 'Correspondance Fuzzy',
                    executableArgs: 'Arguments de la ligne de commande',
                    onlineImageQueries: 'Demande d'image en ligne',
                    imageProviders: 'Fournisseurs d'images',
                    localImages: 'Images locales'
                },
                placeholder: {
                    parserType: 'Sélectionner l'analyseur....',
                    imageProviders: 'Aucune'
                },
                text: {
                    skipWithMissingDataDir: 'Sauter les comptes trouvés avec les répertoires de données manquants',
                    fuzzy_use: 'Utiliser la correspondance approximative',
                    fuzzy_removeCharacters: 'Correspondance agressive',
                    fuzzy_removeBrackets: 'Enlever (...) et [...]',
                    appendArgsToExecutable: 'Ajouter des arguments à l'exécutable',
                    enabled: 'Activer la configuration',
                    advanced: 'Afficher les options avancées',
                    noTitle: 'Pas de titre!'
                }
            },
            service: {
                error: {
                    savingConfiguration: 'Erreur rencontrée lors de l'enregistrement des configurations utilisateur!',
                    readingConfiguration: 'Erreur rencontrée lors de l'enregistrement des configurations utilisateur!',
                },
                validationErrors: {
                    parserType: 'Type d'analyseur incorrect!',
                    configTitle: 'Le titre de la configuration est obligatoire!',
                    parserInput: {
                        noInput: 'Aucune entrée n'est disponible',
                        inputNotAvailable__i: 'L'entrée "${name}" n'est pas disponible!',
                        incorrectParser: 'Analyseur incorrect!',
                    },
                    romDir: 'Le répertoire des ROMs n'est pas valide!',
                    steamDir: 'Le répertoire Steam n'est pas valide!',
                    executable: 'Le fichier exécutable est invalide!',
                    titleModifier: 'Le modificateur de titre doit contenir "${title}"',
                    variableString: 'Nombre inégal de paires "${" et "}". Utilisez "\\\" pour échapper à "${" ou "}" si vous voulez les utiliser comme caractères.',
                    imageProviders: 'Mauvais type de fournisseur d'image!',
                    unhandledValidationKey: 'La validation de l'entrée n'est pas gérée'
                },
                text: {
                    noTitle: 'Pas de titre!'
                }
            }
        },
        fuzzyMatcher: {
            info: {
                downloading: 'La liste des titres pour la correspondance approximative sera téléchargée.',
                successfulDownload: 'Le téléchargement a été un succès. Liste d'enregistrement.',
                checkingIfListIsUpToDate: 'Vérifier si la liste des titres est à jour.',
                listIsOutdated: 'La liste est désuète. La liste des titres pour la correspondance approximative sera téléchargée.',
                listIsUpToDate: 'La liste des titres est à jour.',
                match__i: 'Titre Fuzzy "${fuzzyTitle}" from "${extractedTitle}"',
                equal__i: 'Comparaison Fuzzy: "${a}" == "${b}"',
                notEqual__i: 'Comparaison Fuzzy: "${a}" != "${b}"'
            },
            error: {
                fatalError: 'Une erreur fatale s'est produite lors du chargement de la liste pour le matching approximatif. La correspondance approximative sera ignorée.',
                totalGamesIsUndefined: 'J'ai échoué à obtenir une liste approximative. la touche "totalGames" n'est pas définie.'
            }
        },
        fileParser: {
            error: {
                parserNotFound__i: 'Analyseur "${name}" introuvable!'
            }
        },
        imageProvider: {
            error: {
                webWorkerError__i: 'Une erreur de l'administrateur Web s'est produite. C'est une erreur.',
                unknownWebWorkerError: 'Une erreur inconnue de l'administrateur Web s'est produite. Données d'erreur: ${data}',
            }
        },
        vdfManager: {
            error: {
                noUsersFound: 'Aucun des répertoires Steam fournis ne contenait de répertoire utilisateur',
                couldNotPopulateList__i: 'Impossible de remplir la liste VDF. Erreur.',
                emptyDirectoryList: 'La liste des répertoires est vide.',
                noUserIdsInDir__i: '"${steamDirectory}" ne contient pas d'ID utilisateur.',
                readingVdf__i: 'Impossible de lire dans "${filePath}". ${error}',
                writingVdf__i: 'Impossible d'écrire à "${filePath}". ${error}',
                creatingBackups__i: 'Impossible de créer des sauvegardes. ${error}',
                unsupportedMimeType__i: 'Le type de mime (${type}) n'est pas supporté (title - "${title}").',
                imageError__i: 'Une erreur s'est produite lors du téléchargement de l'image pour "${title}". C'est une erreur.',
                fatalImageError__i: 'Une erreur fatale s'est produite lors du téléchargement de l'image ("${title}":"${url}"). C'est une erreur.',
                couldNotMergeEntries__i: 'Impossible de fusionner les entrées et/ou de remplacer les images. C'est une erreur.',
                couldNotRemoveEntries__i: 'Impossible de supprimer des entrées et/ou de remplacer des images. C'est une erreur.'
            }
        }
    }
}
