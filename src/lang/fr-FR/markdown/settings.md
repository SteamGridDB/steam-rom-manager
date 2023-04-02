## Paramètres généraux
### Mode hors ligne `[Recommander désactivé]`

Si cette option est activée, SRM ne fait aucune requête de réseau, utile si vous voulez seulement utiliser SRM pour les images locales.
### Effacer automatiquement les logs avant de tester les analyseurs `[Recommander désactivé]`
Lorsque cette option est activée, les logs sont effacés chaque fois qu'un analyseur est testé.
### Afficher les images Steam actuelles par défaut `[Recommander activée]`
Lorsque cette option est activée, ce paramètre indique à SRM par défaut d'afficher l'image actuellement utiliser dans Steam pour une application donnée. Si elle est désactivée, alors à chaque fois que SRM est lancé (et enregistré), toutes les images seront réinitialisées.
### Retirer les raccourcis pour les analyseurs désactivés `[Recommander désactivé]`
Lorsque cette option est activée, la désactivation d'un analyseur et l'exécution de SRM supprimera toutes les entrées ajoutées et toutes les images en rapport avec l'analyseur désactivé. Utile si vous voulez que votre bibliothèque Steam soit dans une correspondance 1-1 avec les analyseurs activés.

## Paramètres de correspondance approximative
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.

### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Image provider settings
### Preload retrieved images `[Recommend disabled]`
When enabled, SRM will pull all available artwork for every game, rather than pulling one piece of artwork at a time as the user flips through the images. Don't enable this unless you have a good reason and a very small library of games, otherwise it could result in very large (slow) network requests.
### Enabled providers
Global setting to disable certain providers. Currently the only image provider is `SteamGridDB` since ConsoleGrid and RetroGaming.cloud are defunct.

## Community Variables and Presets
### Force download custom variables.
Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Useful if the custom variables JSON file has been corrupted.
### Force download custom presets.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
