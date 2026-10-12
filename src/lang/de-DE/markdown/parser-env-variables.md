## Umgebungsvariablen
Diese Variablen werden vorgeparst und können auch im Rom Verzeichnis, Steam Verzeichnis, Pfad für ausführbare Dateien, und "Starte in"-Verzeichnis Feldern verwendet werden.
| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                                                |
| ---------------------------------------------------------:|:------------------------------------------------------------------- |
|                                                    `${/}` | Systemspezifische Verzeichnistrenner: `\` oder `/`                 |
|                                               `${srmdir}` | Verzeichnis der portablen ausführbaren SRM Datei                    |
|                                       `${steamdirglobal}` | Globales Steam Verzeichnis, zu finden in `Einstellungen`            |
|                                       `${accountsglobal}` | Globale Benutzerkonten, zu finden in `Einstellungen`                |
|                                        `${romsdirglobal}` | Globales ROM Verzeichnis, zu finden in `Einstellungen`              |
|                                        `${retroarchpath}` | Pfad der ausführbaren Retroarch Datei, zu finden in `Einstellungen` |
|                                              `${racores}` | Verzeichnis der Retroarch Cores, zu finden in `Einstellungen`       |
|                                       `${localimagesdir}` | Verzeichnis der lokalen Bilder, zu finden in `Einstellungen`        |


Der Nutzen der Umgebungsvariable `${srmdir}` besteht darin, SRM vollständig portabel zu machen. Wenn du z.B. das Verzeichnislayout `D:\Games\Roms` und `D:\Games\PortableSRM\SRM.exe`haben möchtest, würdest du das Feld ROMs Verzeichnis auf `${srmdir}${/}..${/}Roms` setzen, um das Spielverzeichnis an einen anderen Ort zu verschieben, ohne dein Setup zu verändern.

Function variables can also be used in fields that permit environment variables (e.g. `${os:win|C:\path\to\startdir|${os:linux|/path/to/startdir}}`)
