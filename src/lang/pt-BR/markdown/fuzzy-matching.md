# Correspondência difusa de Tm

Correspondência difusa (natural) será feita contra a lista de blocos fornecida pelo [SteamGridDB](http://www.steamgriddb.com/). Ele tentará preencher os caracteres que faltam para títulos que aumentarão a probabilidade de encontrar imagens.

Títulos difusos estão disponíveis como modificadores de título via `${fuzzyTitle}`. Correspondência difusa atualmente está ativada apenas para `Analisadores da ROM` e `Analisadores manuais`.

É possível que `falsa` correspondência possa ocorrer para títulos que não estão na lista. Se você encontrar títulos faltantes, sinta-se livre para postar uma issue no [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Substituir caracteres diacríticos

Replaces diacritic characters to their latin equivalent: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Might improve the matching ability of fuzzy matcher.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
