# Icône par défaut (facultatif) `[prend en charge les variables]`{.noWrap}

Permet d'utiliser une image stockée localement, comme icône par défaut. Un [glob spéciale](#special-glob-input) est utilisée pour récupérer les images. Seule la première image récupérée est utilisée.

Cette image sera affichée **seulement** s'il n'y a pas d'autres images disponibles. Si une image Steam est disponible, vous serez en mesure de choisir entre celle de Steam et cette image.

## Extensions d'image autorisées

Only `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} file extensions are supported. Even if parser finds files with other extensions, they are not included into the final list.

## Can you move the directory of default image after saving app list?

Yes, once the list is saved, default icon is copied to a Steam directory where they are renamed to match Steam's APP ID.
