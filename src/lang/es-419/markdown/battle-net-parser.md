# Analizador de Battle.net

Este analizador importa juegos de `Battle.net` para que se pueda escoger el artwork y ser añadido a Steam. Si no funciona es porque Blizzard ha cambiado la estructura de su base de datos de juegos o su fuel.json, en cualquier caso, por favor haslo saber a los desarrolladores de SRM y resolveremos el problema.

El analizador de `Battle.net` es algo especial, ya que utiliza un script de shell en `${srmDir}/scripts/bnet. s1` para lanzar `Battle.net`, espera una cantidad de tiempo apropiada, y sólo entonces ejecuta el título.
