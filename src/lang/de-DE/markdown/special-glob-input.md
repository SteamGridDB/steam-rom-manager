# Special glob input

## Wie funktioniert es?

Bildpfade werden in 4 Schritten aufgelöst:
1. String wird ausgewertet, um zu sehen, ob ein glob-basierter Parser verwendet wird. Abhängig vom Ergebnis kann das weitere Parsen mit `2` Glob-Sätzen fortgesetzt werden.
1. Alle angegebenen Variablen werden durch die entsprechenden Werte ersetzt.
1. Neue(r) String(s) werden gegen das Root-Verzeichnis aufgelöst (Root-Verzeichnis ist immer das ROMs Verzeichnis).
1. Finale String(s) werden an den Glob-Parser übergeben, der dann eine Liste der verfügbaren Dateien zurückgibt.

## Beispiele für die Verwendung

### Absolute Pfade

Nehmen wir an, dass der entpackte Titel `Metroid Fusion [USA]` und der verschwommener Titel `Metroid Fusion` ist. Du kannst einen Bildpfad dann wie folgt erstellen:

- `C:/path/to/images/${title}.*`
- `C:/path/to/images/${fuzzyTitle}.*`

welche dann wie folgt aufgelöst werden:

- `C:/path/to/images/Metroid Fusion [USA].png`
- `C:/path/to/images/Metroid Fusion.jpg`

### Relative Pfade

In diesem Beispiel nehmen wir an, dass das ROMs Verzeichnis `C:/ROMS/GBA` und rom selbst `C:/ROMS/GBA/Metroid Fusion [USA].gba` ist. Richte einen relativen Pfad unter Verwendung von `${filePath}`{.noWrap} oder `${dir}`{.noWrap} Variablen ein, zum Beispiel:

- `${filePath}/../../../path/to/images/${title}.*`
- `${dir}/../../path/to/images/${title}.*`

wird wie folgt ersetzt werden:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`

Hier bedeutet `..` "Traverse back" und erlaubt es, zum vorherigen Verzeichnis zurück zu gehen:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
    - `C:/ROMS/../path/to/images/Metroid Fusion.*`
      - `C:/path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/../path/to/images/Metroid Fusion.*`
    - `C:/path/to/images/Metroid Fusion.*`

### Matching either Fuzzy Title or Extracted Title

To grab images that match either extractedTitle or fuzzyTitle (or a constant default image name) a special syntax can be used:

Suppose you have `Luigi's Mansion (USA).iso` and thus have extractedTitle `Luigi's Mansion (USA)` and fuzzyTitle `Luigi's Mansion`. If we have a directory of artwork with:
```
(1) dir/Luigi's Mansion (USA).png
(2) dir/Luigi's Mansion.png
(3) dir/default.png
```
Then:

- `dir/$(${fuzzyTitle}|@(${title}))$.png` will match and retrieve images (1) and (2)
- `dir/$(${title}|@(${title}|default))$.png` will match and retrieve images (1) and (3)
- `dir/$(${fuzzyTitle}|@(${fuzzyTitle}|default))$.png` will match and retrieve images (2) and (3)
- `dir/$(${title}|@(${fuzzyTitle}|default))$.png` will match match and retrieve images (1) and (2) and (3)
