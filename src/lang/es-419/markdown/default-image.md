# Default image `[supports variables]`{.noWrap}

Permite utilizar una imagen almacenada localmente como imagen predeterminada. Se utiliza una cadena [de entrada glob especial](#special-glob-input) para extraer imágenes. Solo la primera imagen extraída será utilizada.

Se mostrará la primera imagen **únicamente** si no hay disponibles otras imágenes. Si la carátula de Steam está disponible, podrá seleccionar entre la de Steam y esta imagen.

## Extensiones de imagen permitidas

Solo las extensiones de archivo `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} y `TGA`{.noWrap} son compatibles. Aunque el parser encuentre archivos con otras extensiones, estas no se incluyen en la lista final.

## ¿Puede mover el directorio de la imagen predeterminada después de guardar la lista de aplicaciones?

Sí, una vez que la lista sea guardada, la imagen predeterminada será copiada al directorio de Steam donde se renombran para que coincida con el ID DE LA APP de Steam.
