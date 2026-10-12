# Online Bilder Queries `[unterstützt Variablen]`{.noWrap}

Abfragen, mit denen nach Bildern gesucht wird. Um eine Bildabfrage festzulegen, muss folgende Syntax verwendet werden:
```
${...}
```
Zum Beispiel, Bilder für "Legend of Zelda" und "The Legende ofZelda: A Link to the Past" können wie folgt abgefragt werden:
```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```
Du wirst wahrscheinlich Parser-Variablen für Abfragen verwenden wollen. Diese sehen ungefähr so aus(der **Standardwert** Wert):
```
${${fuzzyTitle}}
```
Der Legacy **greedy** Modus kann durch ändern der Abfrage aktiviert werden:
```
${${fuzzyTitle}}${${title}}
```
