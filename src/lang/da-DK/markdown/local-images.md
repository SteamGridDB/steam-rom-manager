# Local images `[supports variables]`{.noWrap}

Allows one to use images stored locally. A [special glob input](#special-glob-input) string is used to retrieve images, so for example you might do `/path/to/heroes/${title}.@(png|jpg)`. Backslashes can be used to escape characters, so that if your images live in `artwork [portraits]` you might do `/path/to/artwork \[portraits\]/${title}.@(png|jpg)`. A good idea is to set your artwork directory globally and then use the `${localimages}` dir environment variable in this field: `${localimagesdir}/emuname/heroes/${title}.@(png|jpg)` for example.

Any variable you use in this field that contains special glob characters will have those characters escaped.

## Allowed image extensions

Only `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} file extensions are supported. Even if parser finds files with other extensions, they are not included into the final list.

## Can you move the directory of local images after saving app list?

Yes, once the list is saved, local images are copied to a Steam directory where they are renamed to match Steam's APP ID.
