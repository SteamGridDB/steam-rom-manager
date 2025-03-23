#

Permite que uma pessoa use uma imagem armazenada localmente, como uma imagem padrão/fallback. Uma entrada glob [especial](#special-glob-input) string é usada para recuperar imagens. Apenas a primeira imagem recuperada é usada.

Esta imagem será exibida **somente** se não houver outras imagens disponíveis. Se a imagem Steam estiver disponível, você poderá escolher do Steam e desta imagem.

## Extensões de imagens permitidas

Apenas `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} extensões de arquivo são suportadas. Mesmo que o analisador encontre arquivos com outras extensões, eles não estão incluídos na lista final.

## Você pode mover o diretório da imagem padrão depois de salvar a lista de aplicativos?

Sim, uma vez que a lista é salva, a imagem padrão é copiada para um diretório Steam onde eles são renomeados para coincidir com o ID APP da Steam.
