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

## Ajustes del proveedor de imágenes
### Precargar imágenes `[Recomendación: desactivado]`
Al estar activado, SRM cargará todas las imágenes disponibles para cada juego, en lugar de cargar una imagen a la vez a medida que el usuario vaya revisando las imágenes. No actives esto a menos que tengas una buena razón y tu biblioteca de juegos sea pequeña, ya que podría resultar en una gran (y lenta) cantidad de peticiones de red.
### Proveedores habilitados
Ajuste global para desactivar ciertos proveedores. Actualment el único proveedor de imágenes es `SteamGridDB` ya que ConsoleGrid y RetroGaming.cloud ya no existen.

## Presets y variables de la comunidad
### Forzar la descarga de variables personalizadas.
Restablece el archivo JSON de variables personalizadas usado para ciertos presets al estado actual en el repositorio de GitHub de SRM. Útil si el archivo JSON de variables personalizadas ha sido corrompido.
### Forzar la descarga de presets personalizados.
Resets the JSON files for parser presets to whatever is on the SRM github. Useful if your presets list is not automatically updating for some reason, or has become corrupted.
