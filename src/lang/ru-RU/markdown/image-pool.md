#

Defaults to `${fuzzyTitle}`{.noWrap} if field is unset.

This field is used to allow games from different parsers to share the same images (i.e. the same "image pool") if they have the same title. If you want different parsers not to share images for games with the same title, just set this field to something unique, for example `${fuzzyTitle} SNES`{.noWrap} or `${fuzzyTitle} ${parserTitle}`{.noWrap}.
