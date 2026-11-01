## Variables d'environnement
These variables are pre parsed and can be used even in the Rom Directory, Steam Directory, Executable Location, and Start In Dir fields.
| Variable (insensible à la casse) | Valeur correspondante                                          |
| --------------------------------:|:-------------------------------------------------------------- |
|                           `${/}` | Séparateur de dossier spécifique au système: `\` ou `/`       |
|                      `${srmdir}` | Répertoire de l'exécutable SRM portable                        |
|              `${steamdirglobal}` | Répertoire Steam global, spécifié dans `Paramètres`            |
|              `${accountsglobal}` | Global user accounts, specified in `Settings`                  |
|               `${romsdirglobal}` | Répertoire des ROMs global, spécifié dans `Paramètres`         |
|               `${retroarchpath}` | Chemin vers l'exécutable Retroarch, spécifié dans `Paramètres` |
|                     `${racores}` | Répertoire des cœurs Retroarch, spécifié dans `Paramètres`     |
|              `${localimagesdir}` | Répertoire de vos images locales, spécifié dans `Paramètres`   |


The utility of the environment variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.

Function variables can also be used in fields that permit environment variables (e.g. `${os:win|C:\path\to\startdir|${os:linux|/path/to/startdir}}`)
