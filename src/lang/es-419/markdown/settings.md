## Configuración general
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Modo offline `[Recomendación: desactivado]`
Al estar activado, SRM no hace pedidos a través de la red, útil si solo quieres usar SRM para imágenes locales.
### Borrar registros automáticamente antes de probar los analizadores `[Recomendación: activado]`
Al estar activado, los registros son eliminados cada vez que un analizador es probado.
## Add Games
### Mostrar las imágenes actuales de Steam por defecto `[Recomendación: activado]`
Al estar activado, este ajuste le dice a SRM que muestre cualquier imagen que esté por defecto actualmente en Steam para la app en cuestión. Si está desactivado, cada vez que SRM se ejecute (y sea guardado) todas las imágenes serán restablecidas.
### Remover accesos directos para analizadores desactivados `[Recomendación: desactivado]`
Al estar activado, desactivar un analizador y ejecutar SRM removerá todas las entradas e imágenes del analizador desactivado. Útil si quieres que tu biblioteca de Steam corresponda con los analizadores activados.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from Add Games
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Ajustes de emparejamiento aproximado
### Registrar los resultados `[Recomendación: desactivado]`
Al estar activado, aparecerán registros más detallados del emparejador en los `registros de eventos`. Útil para depurar emparejamientos aproximados incorrectos.
### Restablecer lista
Restablece la lista de títulos usados para el emparejamiento aproximado a la lista de títulos de `SteamGridDB` (remueve cualquier título agregado por el usuario).
### Restablecer caché
Limpia el caché de títulos que ya se han visto en el emparejamiento aproximado (prueba esto si cambiar la lista de títulos aproximados no resulta en cambios a los títulos en SRM).
## Ajustes del proveedor de imágenes
### Artwork loading strategy `[Recommend Load artwork lazily]`
This is the strategy SRM uses to pull artwork thumbnails for the `Add Games` UI. If you are parsing a lot of games, `Load artwork lazily` is recommended. `Preload first artwork` will try to pull the first piece of artwork for each game in each artwork category, and `Preload all artwork` will try to pull all available artwork for each game in each artwork category. `Preload all artwork` will cause network and performance issues unless the number of games is quite small (less than `30` or so).
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
## Presets y variables de la comunidad
### Forzar la descarga de variables personalizadas.
Restablece el archivo JSON de variables personalizadas usado para ciertos presets a la última versión disponible en el repositorio de GitHub de SRM. Útil si el archivo JSON de variables personalizadas ha sido corrompido.
### Forzar la descarga de presets personalizados.
Restablece los archivos JSON de los presets de analizadores a la última versión disponible en el repositorio de GitHub de SRM. Útil si tu lista de presets no se actualiza automáticamente por alguna razón o ha sido corrompida.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
