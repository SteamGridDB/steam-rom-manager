## Umgebungsvariablen

Diese Variablen werden vorgeparst und können auch im Rom Verzeichnis, Steam Verzeichnis, Executable Location, und Start In Dir Feldern verwendet werden.
| Variable (Groß- und Kleinschreibung) | Entsprechender Wert |
| ------------------------------------:|:------------------------------------------------------- |
| `${/}` | Systemspezifische Verzeichnistrenner: `\` oder `/` |
| `${srmdir}` | Verzeichnis der portablen ausführbaren SRM Datei |
| `${steamdirglobal}` | Global steam directory, specified in `Settings` |
| `${accountsglobal}` | Global user accounts, specified in `Settings` |
| `${romsdirglobal}` | Global ROMs directory, specified in `Settings` |
| `${retroarchpath}` | Path to Retroarch executable, specified in `Settings` |
| `${racores}` | Directory of retroarch cores, specified in `Settings` |
| `${localimagesdir}` | Directory of your local images, specified in `Settings` |

Der Nutzen der Umgebungsvariable `${srmdir}` besteht darin, SRM vollständig portabel zu machen. Wenn du z.B. das Verzeichnislayout `D:\Games\Roms` und `D:\Games\PortableSRM\SRM.exe`haben möchtest, würdest du das Feld Roms Directory auf `${srmdir}${/}..${/}Roms` setzen, um das Spielverzeichnis an einen anderen Ort zu verschieben, ohne dein Setup zu verändern.
