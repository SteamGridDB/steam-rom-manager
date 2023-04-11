# Fuzzy matching

Fuzzy (natural) matching will be done against the tittle list provided by [SteamGridDB](http://www.steamgriddb.com/). Es wird versuchen, fehlende Zeichen für Prädikate auszufüllen, was die Wahrscheinlichkeit erhöht, Bilder zu finden.

Fuzzy titles are available as title modifiers via `${fuzzyTitle}`. Currently fuzzy matching is only enabled for `ROM Parsers` and `Manual Parsers`.

It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Replace diacritic characters

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
