# Analizador de Epic Games

Este analizador importa juegos de la [Epic Games Store](https://store.epicgames.com/en-US/) para que las Ilustraciones puedan ser elegidas para estas y puedan ser añadidos a Steam.

Si no funciona es porque Epic ha cambiado la estructura de sus manifiestos de juegos, en tal caso, por favor haslo saber a los desarrolladores de SRM y resolveremos el problema.

Para que este analizador funcione con la alternativa Epic [Legendary](https://github.com/derrod/legendary) de código abierto, [EGL sync debe estar habilitada en el Legendary](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748) (esto crea los archivos necesarios que analizador debe leer, y no requiere instalar la `Epic Games Store`).

Dicho esto, también hay un analizador de `Legendary` en SRM que funciona de inmediato.

## Compatibilidad
Actualmente, este analizador funciona solamente en sistemas `Windows` y `Mac OS`. En `Mac OS` no es posible ejecutar desde la Epic Store, por lo que la opción debe permanecer deshabilitada.
