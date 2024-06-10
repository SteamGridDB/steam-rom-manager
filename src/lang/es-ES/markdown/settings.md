## Ajustes generales
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Modo sin conexión `[Recomendado: desactivado]`
Si se activa, SRM no accederá a internet. Útil si solo quieres usarlo con imágenes locales.
### Vaciar registro automáticamente antes de analizar `[Recomendado: activado]`
Si está activado, se vaciará el registro cada vez que se pruebe a analizar.
## Add Games
### Mostrar imágenes en uso por defecto `[Recomendado: activado]`
Si está activado, SRM usará las imágenes que estén actualmente usándose en Steam. Si se desactiva, cada vez que se ejecute (y guarde) SRM se resetearán las imágenes.
### Eliminar accesos directos de análisis desactivados `[Recomendado: desactivado]`
Si está activado, al desactivar un análisis y ejecutar SRM, se eliminarán todas las entradas e imágenes del análisis desactivado. Útil si quieres mantener tu biblioteca de Steam idéntica a las fuentes analizadas.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Fuzzy Matcher Settings
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.
### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Ajustes de proveedores de imágenes
### Pre-cargar imágenes obtenidas `[Recomendado: deshabilitado]`
Si está activado, SRM obtendrá todas las imágenes disponibles para cada juego, en lugar de obtener cada imagen según se muestra. No lo actives a no ser qué tengas un muy buen motivo y una biblioteca de juegos muy reducida, de lo contrario, podría llevar a grandes (y lentas) peticiones a internet.
### Proveedores habilitados
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## Plantillas y variables de la comunidad
### Forzar descargar variables personalizadas.
Restablece el archivo JSON de variables personalizadas que se usa para ciertas plantillas a su estado actual en el GitHub de SRM. Útil si el JSON con las variables personalizadas se ha corrompido.
### Forzar descargar plantillas personalizadas.
Restablece los archivos JSON de que se usa para ciertas plantillas a su estado actual en el GitHub de SRM. Útil si su lista de plantillas no se actualiza automáticamente por alguna razón, o se ha corrompido.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
