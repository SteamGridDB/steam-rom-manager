# Titel der benutzerdefinierten Variable (optional)

Erlaubt es, den entpackten Titel mit einer benutzerdefinierten Variable zu überschreiben. This is done right after title extraction, meaning that the replaced title can be used for fuzzy matching and so on. Groups and variables themselves are **case-sensitive**, unless case-insesitive variable option is enabled.

Title matching can be limited to specific groups of custom variables. In order to specify groups, the following syntax must be used:

```
${...}
```

For example, this is how you specify groups for "RPCS3" and "rpcs3":

```
${RPCS3}${rpcs3}
```

Make sure you **toggle enable to on**.

## Case-insensitive option

If this option is enabled, case-insensitive matching will be done and first matched custom variable will be used.

## Note. Diese Funktion ist **experimentell**

Grundsätzlich könnte sich dies in einer zukünftigen Version ändern (sehr unwahrscheinlich). Furthermore, currently the only way to add variables is to create/edit `customVariables.json` used by SRM directly.

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
}
}
}
}
```

Wenn dein Benutzer-Glob `MyDir/${title}.wad` wäre und du eine `The Legend of Zelda.wad` in `MyDir` hast, würdest du den Titel des benutzerdefinierten Variablenfeldes auf `${Custom Stuff}` setzen, um einen endgültigen Titel von "Die Legende des Links" zu erhalten.
