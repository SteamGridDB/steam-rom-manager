# ¿Qué es un APP ID de Steam?

Steam utiliza APP ID para identificar juegos. Para los juegos que no son Steam se generan usando:

- Ejecutables;
- Título final de la aplicación.

Si usas `RetroArch` o emuladores similares para añadir el mismo juego, pero en diferentes consolas, te encontrarás con un problema en el que solo se añade **un** título y el resto simplemente desaparecen. Se debe a APP IDs duplicados.

## Añadir títulos idénticos de diferentes consolas

El APP ID de Steam no debe ser idéntico. Esto se puede lograr cambiando el valor de **Modificador de título** o habilitando **Añadir argumentos a ejecutables**. La segunda opción añade una tercera variable a APP ID:

- Ejecutables;
- Título final de la aplicación;
- Argumentos de consola de comandos.

La mayor parte de tiempo la línea de comandos contendrá una ruta de juego única que debería permitir generar ID de aplicación únicos.
