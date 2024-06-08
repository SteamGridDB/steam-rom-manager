## Paramètres généraux
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games`, when removing all games from `Settings`, and when refreshing games from `View Games`).
### Auto restart Steam
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Mode hors ligne `[Recommander désactivé]`
Si cette option est activée, SRM ne fait aucune requête de réseau, utile si vous voulez seulement utiliser SRM pour les images locales.
### Effacer automatiquement les logs avant de tester les analyseurs `[Recommander désactivé]`
Lorsque cette option est activée, les logs sont effacés chaque fois qu'un analyseur est testé.
## Add Games
### Afficher les images Steam actuelles par défaut `[Recommander activée]`
Lorsque cette option est activée, ce paramètre indique à SRM par défaut d'afficher l'image actuellement utiliser dans Steam pour une application donnée. Si elle est désactivée, alors à chaque fois que SRM est lancé (et enregistré), toutes les images seront réinitialisées.
### Retirer les raccourcis pour les analyseurs désactivés `[Recommander désactivé]`
Lorsque cette option est activée, la désactivation d'un analyseur et l'exécution de SRM supprimera toutes les entrées ajoutées et toutes les images en rapport avec l'analyseur désactivé. Utile si vous voulez que votre bibliothèque Steam soit dans une correspondance 1-1 avec les analyseurs activés.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Paramètres de correspondance approximative
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.
### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Paramètres du fournisseur d'images
### Précharger toutes les images trouvées `[Recommander désactivé]`
Lorsque cette option est activée, SRM préchargera toutes les images disponibles pour chaque jeu, plutôt que de charger une image à la fois au fur et à mesure que l'utilisateur se déplace dans les images. Ne l'activez pas à moins que vous n'ayez une bonne raison et une très petite bibliothèque de jeux, sinon cela pourrait donner lieu à de très grandes (et lentes) requêtes réseau.
### Activés fournisseurs d'images
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## Paramètres de variable/préréglage de la communauté
### Forcer le téléchargement des variables personnalisées.
Réinitialise le fichier JSON des variables personnalisées qui est utilisé pour certains préréglages en utilisant le fichier sur le github SRM. Utile si le fichier JSON des variables personnalisées a été corrompu.
### Forcer le téléchargement des configurations prédéfinies.
Réinitialise les fichiers JSON pour les préréglages de l'analyseur en utilisant le fichier sur le github SRM. Utile si votre liste de pré-configurations n'est pas automatiquement mise à jour pour une raison quelconque, ou est corrompue.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
