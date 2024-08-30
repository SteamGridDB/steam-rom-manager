# Exceções do Usuário

## Para o que não usar isto

Esta ferramenta pode ser usada para definir por app exceções que sobrepõem os analisadores. Não deve ser utilizado para realizar tarefas em massa. Por exemplo, remover o caractere dois-pontos dos títulos pode ser feito através do modificador de título `${/:/-;${title}├}` e não deve ser feito aqui. Se um argumento de linha de comando é comum a cada app analisado, então use o campo de argumento de linha de comando - não crie um monte de entradas aqui!

## Título Extraído - _Obrigatório_

O único campo de exceção obrigatório é `Título Extraído`. Once this is specified and the exception is saved, any game that matches will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing).

The `Extracted Title` field matches in two ways:

- Based on the `Exception ID` (found by running test parser). For example if the game were `Portal 1` and its `Exception ID` was `12345` then you might put `Portal 1 ${id:12345}`. If the `Exception ID` is present then it doesn't matter what label you put in front of it, but for readability and searchability it's nice to put the game's actual name in front of the `Exception ID`.
- Based on the `Extracted Title` (found by running test parser). For example if the `Extracted Title` were `Portal 2` you would put `Portal 2`.

Thus you can either have an exception that applies to all games with the same name or an exception that applies only to an exact game (`Exception ID`s are unique). The reason for this is primarily backwards compatibility -- SRM formerly matched only on the `Extracted Title`.

Exceptions generated from `Preview` will always be in the form `Extracted Title ${id:XXXXXX}`.

## Embed Html Callback

This is the title that will display in Steam. It will not be used to search for images.

## Novo título de pesquisa

This is the title that will be used to search for images on [SteamGridDB](https://www.steamgriddb.com). There are two options for overriding it:

- Specify the new search title as whatever text you want.
- Especifique o Id exato do jogo para puxar imagens. Por exemplo, para obter imagens para o jogo [Flow](https://www.steamgriddb.com/game/5254019) que tem a url SteamGridDB `https://www. teamgriddb.com/game/5254019` você colocaria `${gameid:5254019}`.

## Novo Artigos de linha de comando

Argumentos personalizados de linha de comando como `--fullscreen`, etc, que podem ser aplicados a um título específico. These only override the arguments field of the Steam shortcut and are never appended to the executable.

## Excluir Título

A capacidade de excluir títulos individuais de serem adicionados à Steam. Isso permite que você mantenha títulos que você não quer na Steam na mesma pasta que os outros jogos.

## Apenas Arte Local

Não buscar arte de provedores remotos (por exemplo, [steamgriddb](https://www.steamgriddb.com)). Useful when SGDB is incorrectly matching the game or you just don't like any of the artwork available for it.

## Variáveis personalizadas

A tarefa de substituir títulos específicos também pode ser realizada editando manualmente o arquivo JSON personalizado e usando variáveis apropriadas no campo analisador de `Modificador de Título`. No entanto, é recomendável que você usa essa ferramenta, em vez disso, já que o arquivo JSON de variáveis personalizadas será atualizado ao longo do tempo e suas edições poderão ser substituídas.
