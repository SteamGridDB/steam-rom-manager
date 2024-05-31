## Configuración general
### Modo offline `[Recomendación: desactivado]`

Al estar activado, SRM no hace pedidos a través de la red, útil si solo quieres usar SRM para imágenes locales.
### Borrar registros automáticamente antes de probar los analizadores `[Recomendación: activado]`
Al estar activado, los registros son eliminados cada vez que un analizador es probado.
### Mostrar las imágenes actuales de Steam por defecto `[Recomendación: activado]`
Al estar activado, este ajuste le dice a SRM que muestre cualquier imagen que esté por defecto actualmente en Steam para la app en cuestión. Si está desactivado, cada vez que SRM se ejecute (y sea guardado) todas las imágenes serán restablecidas.
### Remover accesos directos para analizadores desactivados `[Recomendación: desactivado]`
Al estar activado, desactivar un analizador y ejecutar SRM removerá todas las entradas e imágenes del analizador desactivado. Útil si quieres que tu biblioteca de Steam corresponda con los analizadores activados.

## Ajustes de emparejamiento aproximado
### Registrar los resultados `[Recomendación: desactivado]`
Al estar activado, aparecerán registros más detallados del emparejador en los `registros de eventos`. Útil para depurar emparejamientos aproximados incorrectos.

### Restablecer lista
Restablece la lista de títulos usados para el emparejamiento aproximado a la lista de títulos de `SteamGridDB` (remueve cualquier título agregado por el usuario).
### Restablecer caché
Limpia el caché de títulos que ya se han visto en el emparejamiento aproximado (prueba esto si cambiar la lista de títulos aproximados no resulta en cambios a los títulos en SRM).

## Ajustes del proveedor de imágenes
### Precargar imágenes `[Recomendación: desactivado]`
Al estar activado, SRM cargará todas las imágenes disponibles para cada juego, en lugar de cargar una imagen a la vez a medida que el usuario vaya revisando las imágenes. No actives esto a menos que tengas una buena razón y tu biblioteca de juegos sea pequeña, ya que podría resultar en una gran (y lenta) cantidad de peticiones de red.
### Proveedores habilitados
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.

## Presets y variables de la comunidad
### Forzar la descarga de variables personalizadas.
Restablece el archivo JSON de variables personalizadas usado para ciertos presets a la última versión disponible en el repositorio de GitHub de SRM. Útil si el archivo JSON de variables personalizadas ha sido corrompido.
### Forzar la descarga de presets personalizados.
Restablece los archivos JSON de los presets de analizadores a la última versión disponible en el repositorio de GitHub de SRM. Útil si tu lista de presets no se actualiza automáticamente por alguna razón o ha sido corrompida.
