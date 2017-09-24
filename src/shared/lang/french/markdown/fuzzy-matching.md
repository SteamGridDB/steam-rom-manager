# Correspondance approximative

Lorsqu'elle est activée, la correspondance floue (naturelle) sera faite par rapport à la liste de titres fournie par [SteamGridDB](http://www.steamgriddb.com/). Il tentera de remplir les caractères manquants pour les titres, ce qui augmentera la probabilité de trouver des images.

Il est possible que `false` peut se produire pour les titres qui ne figurent pas dans la liste. Si vous rencontrez des titres manquants, n'hésitez pas à poster un article sur [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Correspondance agressive

Lorsqu'il est activé, le matcher flou supprimera tous les caractères sauf `a-zA-Z0-9 ()[]` et remplacera `_` par espace. Ceci devrait améliorer la capacité d'appariement de la Correspondance approximative

## Correspondance agressive

Lorsqu'elle est activée, la fonction fuzzy matcher supprimera tous les fichiers `(...)`{.noWrap} et `[...]`{.noWrap} avec leur contenu. Utile pour les titres avec `[USA]`{.noWrap}, `[JPN]`{.noWrap} et autres, car ils empêchent de faire correspondre correctement les titres.
