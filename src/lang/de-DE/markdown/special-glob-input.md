# Spezieller Glob input

## Wie funktioniert es?

Bildpfade werden in 4 Schritten aufgelöst:
1. Der String wird ausgewertet, um zu sehen, ob ein Glob-basierter Parser verwendet wird. Abhängig vom Ergebnis kann das weitere Parsen mit `2` Glob-Sets fortgesetzt werden.
1. Alle angegebenen Variablen werden durch die entsprechenden Werte ersetzt.
1. Neue(r) String(s) werden gegen das Root-Verzeichnis aufgelöst (Root-Verzeichnis ist immer das ROMs Verzeichnis).
1. Finale String(s) werden an den Glob-Parser übergeben, der dann eine Liste der verfügbaren Dateien zurückgibt.

## Beispiele für die Verwendung

### Absolute Pfade

Nehmen wir an, dass der entpackte Titel `Metroid Fusion [USA]` und der Fuzzy Titel `Metroid Fusion` ist. Dann kannst du einen Bildpfad wie folgt erstellen:

- `C:/Pfad/zu/Bildern/${title}.*`
- `C:/Pfad/zu/Bildern/${fuzzyTitle}.*`

welche wie folgt aufgelöst werden:

- `C:/Pfad/zu/Bildern/Metroid Fusion [USA].png`
- `C:/Pfad/zu/Bildern/Metroid Fusion.jpg`

### Relative Pfade

In diesem Beispiel nehmen wir an, dass das ROMs Verzeichnis `C:/ROMS/GBA` und die ROM `C:/ROMS/GBA/Metroid Fusion [USA].gba` ist. Setze einen relativen Pfad unter Verwendung von `${filePath}`{.noWrap} oder `${dir}`{.noWrap} Variablen ein, zum Beispiel:

- `${filePath}/../../../Pfad/zu/Bildern/${title}.*`
- `${dir}/../../Pfad/zu/Bildern/${title}.*`

wird wie folgt ersetzt:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../Pfad/zu/Bildern/Metroid Fusion.*`
- `C:/ROMS/GBA/../../Pfad/zu/Bildern/Metroid Fusion.*`

Hier bedeutet `..` "Traverse back" und erlaubt es, zum vorherigen Verzeichnis zurück zu gehen:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../Pfad/zu/Bildern/Metroid Fusion.*`
  - `C:/ROMS/GBA/../../Pfad/zu/Bildern/Metroid Fusion.*`
    - `C:/ROMS/../Pfad/zu/Bildern/Metroid Fusion.*`
      - `C:/Pfad/zu/Bildern/Metroid Fusion.*`
- `C:/ROMS/GBA/../../Pfad/zu/Bildern/Metroid Fusion.*`
  - `C:/ROMS/../Pfad/zu/Bildern/Metroid Fusion.*`
    - `C:/Pfad/zu/Bildern/Metroid Fusion.*`
