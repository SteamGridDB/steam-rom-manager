# Local images `[supports variables]`{.noWrap}

Permite o uso de imagens altas armazenadas localmente. A [special glob input](#special-glob-input) string is used to retrieve images, so for example you might do `/path/to/heroes/${title}.@(png|jpg)`. Backslashes can be used to escape characters, so that if your images live in `artwork [portraits]` you might do `/path/to/artwork \[portraits\]/${title}.@(png|jpg)`. A good idea is to set your artwork directory globally and then use the `${localimages}` dir environment variable in this field: `${localimagesdir}/emuname/heroes/${title}.@(png|jpg)` for example.

Any variable you use in this field that contains special glob characters will have those characters escaped.

## Extensões de imagens permitidas

Apenas `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} extensões de arquivo são suportadas. Mesmo que o analisador encontre arquivos com outras extensões, eles não estão incluídos na lista final.

## Você pode mover o diretório da imagem padrão depois de salvar a lista de aplicativos?

Sim, uma vez que a lista é salva, a imagem padrão é copiada para um diretório Steam onde eles são renomeados para coincidir com o ID APP da Steam.
