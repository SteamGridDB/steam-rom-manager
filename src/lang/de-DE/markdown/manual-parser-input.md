# Manual Parser specific inputs

## Manifest-Verzeichnis `[unterstützt Umgebungsvariablen]`{.noWrap}

Der Speicherort der json-Dateien, die du in Steam-Verknüpfungen umwandeln möchtest. `Manifest-Verzeichnis` wird in dieser Form erwartet:

```
/path/to/manifests
--manifest1.json
--manifest2.json
--manifest3.json
...
```

Die Namen der Dateien sind egal. Wichtig ist, dass jede `manifest.json` Datei entweder ein einzelner Titel ist, wie:

```json
{
  "title": "gameTitle",
  "target": "game/path/target.sh",
  "startIn": "game/path",
  "launchOptions": "--args"
}
```

Oder eine Liste von Titeln, wie diese:

```json
[
  {
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args"
  },
  {
    "title": "gameTitle2",
    "target": "game2/path/target.sh",
    "startIn": "game2/path",
    "launchOptions": "--args2"
  }
]
```

Ein typischer Anwendungsfall wäre die Verwendung einer einzigen json-Datei pro Spiel, pro Jahr usw.
