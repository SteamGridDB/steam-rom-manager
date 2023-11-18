# Titel aus benutzerdefinierten Variablen (optional)

Erlaubt es, den extrahierten Titel mit einer benutzerdefinierten Variable zu überschreiben. Dies passiert direkt nach der Extraktion des Titels, damit dieser nachfolgend mit Hilfe von Fuzzy matching bearbeitet werden kann. Gruppen und Variablen beachten Groß- und Kleinschreibung, außer etwas anderes ist aktiviert.

Titel Matching kann auf einzelne Gruppen von benutzerdefinierten Variablen eingeschränkt werden. Verwende folgenden Syntax um Gruppen zu spezifizieren:
```
${...}
```
Zum Beispiel kannst du Gruppen für"RPCS3" and "rpcs3" so definieren:
```
${RPCS3}${rpcs3}
```

Stelle sicher, dass dies aktiviert ist.


## Groß- und Kleinschreibung ignorieren

Wenn dies aktiviert ist, wird der erste Treffer benutzt.

## Hinweis. Diese Funktion ist **experimentell**

Grundsätzlich könnte sich dies in einer zukünftigen Version ändern (sehr unwahrscheinlich). Außerdem können momentan neue Variablen nur hinzugefügt/editiert werden indem man `customVariables.json` direkt anpasst.

Diese Datei ist/sollte sich im Verzeichnis `userData` von SRM befinden.

SRM wird Fehler ausgeben, wenn nicht die folgende JSON-Struktur verwendet wird:

```
{
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
```

Wenn dein Benutzer-Glob `MyDir/${title}.wad` wäre und du eine `The Legend of Zelda.wad` in `MyDir` hast, würdest du den Titel des benutzerdefinierten Variablenfeldes auf `${Custom Stuff}` setzen, um einen endgültigen Titel von "Die Legende des Links" zu erhalten.
