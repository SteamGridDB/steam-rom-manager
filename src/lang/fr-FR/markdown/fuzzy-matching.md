# Fuzzy matching

Fuzzy (natural) matching will be done against the tittle list provided by [SteamGridDB](http://www.steamgriddb.com/). It will try to fill in missing characters for titles which will increase probability for finding images.

Fuzzy titles are available as title modifiers via `${fuzzyTitle}`. Currently fuzzy matching is only enabled for `ROM Parsers` and `Manual Parsers`.

It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Remplacer les caractères diacritiques

Replaces diacritic characters to their latin equivalent: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Might improve the matching ability of fuzzy matcher.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
