# Default image `[supports variables]`{.noWrap}

Allows one to use an image, stored locally, as a default/fallback image. A [special glob input](#special-glob-input) string is used to retrieve images. Only the first retrieved image is used.

This image will be shown **only** if there are no other images available. If Steam image is available, you will be able to choose from Steam and this image.

## Allowed image extensions

Only `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} file extensions are supported. Even if parser finds files with other extensions, they are not included into the final list.

## Can you move the directory of default image after saving app list?

Yes, once the list is saved, default image is copied to a Steam directory where they are renamed to match Steam's APP ID.
