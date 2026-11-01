# EA Desktop Parser Specific Inputs

## Sobreescribir el Directorio de EA Games
Por defecto, Steam ROM Manager asume que sus juegos `EA Desktop` están instalados en ``C:\Program Files\EA Games\`. Este campo le permite cambiar a donde estén instalados tus juegos, por ejemplo,``D:\Games\EA Games`.

## Ejecutar juegos vía EA Desktop
Si está habilitado, SRM añadirá un acceso directo a `origin2://game/launch/?offerIds=${gameid}` en lugar de solo el ejecutable del juego. Esto asegura que el juego se lance a través de EA y tenga acceso a servicios en línea.

`Esto es necesario para añadir juegos de EA Play. Los juegos de EA Play no se detectarán si no se activa esta opción.`
