# Battle.net Parser

This parser imports games from the `Battle.net` app, so that artwork can be chosen for them and they can be added into Steam. If it doesn't work it is because Blizzard has altered the structure of their database files, in which case please let the developers of SRM know and we will resolve the issue.

El analizador de `Battle.net` es algo especial, ya que utiliza un script de shell en `${srmDir}/scripts/bnet. s1` para lanzar `Battle.net`, espera una cantidad de tiempo adecuada, y sólo entonces ejecuta el título real.
