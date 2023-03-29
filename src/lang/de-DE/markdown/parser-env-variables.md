## Umgebungsvariablen
Diese Variablen werden vorgeparst und können auch im Rom Verzeichnis, Steam Verzeichnis, Executable Location, und Start In Dir Feldern verwendet werden.
| Variable (Groß- und Kleinschreibung) | Entsprechender Wert                                     |
| ------------------------------------:|:------------------------------------------------------- |
|                               `${/}` | System specific directory separator: `\` or `/`        |
|                          `${srmdir}` | Directory of portable SRM executable                    |
|                  `${steamdirglobal}` | Global steam directory, specified in `Settings`         |
|                   `${romsdirglobal}` | Global ROMs directory, specified in `Settings`          |
|                   `${retroarchpath}` | Path to Retroarch executable, specified in `Settings`   |
|                         `${racores}` | Directory of retroarch cores, specified in `Settings`   |
|                  `${localimagesdir}` | Directory of your local images, specified in `Settings` |


The utility of the environment variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
