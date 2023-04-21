# Emparejamiento aproximado

El emparejamiento aproximado (natural) se hará con la lista proporcionada por [SteamGridDB](http://www.steamgriddb.com/). Intentará rellenar caracteres faltantes para los títulos, lo que aumentará la probabilidad de encontrar imágenes.

Los títulos aproximados están disponibles como modificadores de títulos a través de `${fuzzyTitle}`. Actualmente el emparejamiento aproximado solo está habilitado para los `Analizadores de ROMs` y los `Analizadores manuales`.

It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Replace diacritic characters

Replaces diacritic characters to their latin equivalent: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Might improve the matching ability of fuzzy matcher.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
