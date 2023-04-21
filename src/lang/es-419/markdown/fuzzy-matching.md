# Emparejamiento aproximado

El emparejamiento aproximado (natural) se hará con la lista proporcionada por [SteamGridDB](http://www.steamgriddb.com/). Intentará rellenar caracteres faltantes para los títulos, lo que aumentará la probabilidad de encontrar imágenes.

Los títulos aproximados están disponibles como modificadores de títulos a través de `${fuzzyTitle}`. Actualmente el emparejamiento aproximado solo está habilitado para los `Analizadores de ROMs` y los `Analizadores manuales`.

Es posible que ocurran emparejamientos `falsos` para títulos que no estén en la lista. Si encuentras títulos faltantes, no dudes en publicarlos en la sección Issues en [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Reemplazar caracteres diacríticos

Reemplaza los caracteres diacríticos a su equivalente en latín: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Podría mejorar la capacidad de encontrar resultados del emparejador.

## Emparejamiento agresivo

Al estar activado, el emparejador removerá todos los caracteres excepto `a-z A-Z 0-9 ()[]` y reemplazará `_` con un espacio. Esto debería mejorar la habilidad del emparejador de encontrar resultados.

## Remover paréntesis (...) y corchetes [...]

Al estar activado, el emparejador removerá todos los paréntesis `(...)`{.noWrap} y corchetes `[...]`{.noWrap} incluyendo su contenido. Útil para títulos que contengan `[USA]`{.noWrap}, `[JPN]`{.noWrap}, etc., ya que evitan que los títulos se encuentren correctamente.
