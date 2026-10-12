## Variables de entorno
Estas variables son pre-analizadas y pueden ser usadas en los campos de Directorio de roms, Directorio de Steam, Ubicación del ejecutable e Iniciar en.
| Variable (distingue entre mayúsculas) | Valor correspondiente                                                 |
| -------------------------------------:|:--------------------------------------------------------------------- |
|                                `${/}` | Separador de carpetas del sistema operativo: `\` o `/`               |
|                           `${srmdir}` | Directorio del ejecutable portable de SRM                             |
|                   `${steamdirglobal}` | Directorio global de Steam, especificado en los `Ajustes`             |
|                   `${accountsglobal}` | Global user accounts, specified in `Settings`                         |
|                    `${romsdirglobal}` | Directorio global de ROMs, especificado en los `Ajustes`              |
|                    `${retroarchpath}` | Ruta al ejecutable de Retroarch, especificado en los `Ajustes`        |
|                          `${racores}` | Directorio de los núcleos de Retroarch, especificado en los `Ajustes` |
|                   `${localimagesdir}` | Directorio de tus imágenes locales, especificado en los `Ajustes`     |


La utilidad de la variable `${srmdir}` es hacer a SRM completamente portable, por ej. si quisieras tener como Directorio de ROMs a `D:\Juegos\Roms` y a SRM en `D:\Juegos\PortableSRM\SRM.exe` y configuraras el Directorio de ROMs para que sea `${srmdir}${/}..${/}Roms`, esto te permitiría mover la carpeta Juegos sin romper tu configuración.

Function variables can also be used in fields that permit environment variables (e.g. `${os:win|C:\path\to\startdir|${os:linux|/path/to/startdir}}`)
