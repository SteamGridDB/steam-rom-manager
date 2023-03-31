## Configuración general
### Modo offline `[Recomendación: desactivado]`

Al estar activado, SRM no hace pedidos a través de la red, útil si solo quieres usar SRM para imágenes locales.
### Borrar registros automáticamente antes de probar los analizadores `[Recomendación: activado]`
Al estar activado, los registros son eliminados cada vez que un analizador es probado.
### Mostrar las imágenes actuales de Steam por defecto `[Recomendación: activado]`
Al estar activado, este ajuste le dice a SRM que muestre cualquier imagen que esté por defecto actualmente en Steam para la app en cuestión. Si está desactivado, cada vez que SRM se ejecute (y sea guardado) todas las imágenes serán restablecidas.
### Remover accesos directos para analizadores desactivados `[Recomendación: desactivado]`
Al estar activado, desactivar un analizador y ejecutar SRM removerá todas las entradas e imágenes del analizador desactivado. Útil si quieres que tu biblioteca de Steam corresponda con los analizadores activados.

## Fuzzy Matcher Settings
### Log matching results `[Recommend disabled]`
When enabled more verbose logs appear for the fuzzy title matcher in the `Event log`. Useful for debugging incorrect fuzzy matches.

### Reset fuzzy list
Resets the stored list of titles used for fuzzy matching to the list of titles returned by `SteamGridDB` (removes any user added titles).
### Reset fuzzy cache
Clears the cache of titles that fuzzy matching has already seen (try this if changes you make to fuzzy list are not resulting in changes to titles in SRM).

## Image provider settings
### Preload retrieved images `[Recommend disabled]`
When enabled, SRM will pull all available artwork for every game, rather than pulling one piece of artwork at a time as the user flips through the images. Don't enable this unless you have a good reason and a very small library of games, otherwise it could result in very large (slow) network requests.
### Enabled providers
Global setting to disable certain providers. Currently the only image provider is `SteamGridDB` since ConsoleGrid and RetroGaming.cloud are defunct.

## Community Variables and Presets
### Force download custom variables.
Resets the custom variables JSON file that is used for certain presets to whatever its current state is on the SRM github. Useful if the custom variables JSON file has been corrupted.
### Force download custom presets.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
