# Correspondência difusa de Tm

Correspondência difusa (natural) será feita contra a lista de blocos fornecida pelo [SteamGridDB](http://www.steamgriddb.com/). Ele tentará preencher os caracteres que faltam para títulos que aumentarão a probabilidade de encontrar imagens.

Títulos difusos estão disponíveis como modificadores de título via `${fuzzyTitle}`. Correspondência difusa atualmente está ativada apenas para `Analisadores da ROM` e `Analisadores manuais`.

É possível que `falsa` correspondência possa ocorrer para títulos que não estão na lista. Se você encontrar títulos faltantes, sinta-se livre para postar uma issue no [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Substituir caracteres diacríticos

Substitui os caracteres diacríticos por seu equivalente latino: `A➲` -> `A`, `E➲` -> `E`, `E➲` -> `E`, etc. Pode melhorar a capacidade combinada de um "matcher" difuso.

## Correspondência agressiva

Quando ativado, o matcher difuso removerá todos os caracteres exceto `a-zA-Z0-9 ()[]` e substituirá `_` por espaço. Pode melhorar a capacidade combinada de um "matcher" difuso.

## Remover (...) e [...] parênteses

Quando ativado, o matcher difuso removerá todos os `(...)`{.noWrap} e `[...]`{.noWrap} junto com seu conteúdo. Útil para títulos com `[USA]`{.noWrap}, `[JPN]`{.noWrap} e etc., pois eles impedem que os títulos correspondam corretamente.
