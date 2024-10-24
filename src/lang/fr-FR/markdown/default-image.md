# Default image `[supports variables]`{.noWrap}

Permet d'utiliser une image stockée localement, comme bannière par défaut. Un [glob spéciale](#special-glob-input) est utilisée pour récupérer les images. Seule la première image récupérée est utilisée.

Cette image sera affichée **seulement** s'il n'y a pas d'autres images disponibles. Si une image Steam est disponible, vous serez en mesure de choisir entre celle de Steam et cette image.

## Extensions d'image autorisées

Seulement les `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} et `TGA`{.noWrap} sont pris en charge. Même si l'analyseur trouve des fichiers avec d'autres extensions, ils ne seront pas inclus dans la liste finale.

## Est-il possible déplacer le répertoire de l'image par défaut après avoir enregistré la liste des applications?

Oui, une fois la liste enregistrée, la bannière par défaut est copiée dans un répertoire Steam où il est renommé pour correspondre à l'APP ID de Steam.
