# Online Bildabfrage `[unterstützt Variablen]`{.noWrap}

Abfragen, mit denen nach Bildern gesucht wird. Um eine Bildabfrage festzulegen, muss folgende Syntax verwendet werden:

```
${...}
```

Zum Beispiel, Bilder für "Legende von Zelda" und "Die Legende von Zelda: Ein Link zur Vergangenheit" können wie folgt abgefragt werden:

```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```

Du wirst höchstwahrscheinlich Parser-Variablen für Abfragen verwenden wollen. Welche so aussehen werden (auch der **Standardwert** Wert):

```
${${fuzzyTitle}}
```

The legacy **greedy** mode can be enabled by setting query to:

```
${${fuzzyTitle}}${${title}}
```
