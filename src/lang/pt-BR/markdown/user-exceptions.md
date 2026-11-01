# Exceções do Usuário
## Para o que não usar isto
Esta ferramenta pode ser usada para definir por app exceções que sobrepõem os analisadores. Não deve ser utilizado para realizar tarefas em massa. Por exemplo, remover o caractere dois-pontos dos títulos pode ser feito através do modificador de título `${/:/-;${title}├}` e não deve ser feito aqui. Se um argumento de linha de comando é comum a cada app analisado, então use o campo de argumento de linha de comando - não crie um monte de entradas aqui!

## Título Extraído - *Obrigatório*
O único campo de exceção obrigatório é `Título Extraído`. Uma vez especificado e a exceção salva, qualquer jogo que corresponda terá seus campos substituídos por quaisquer campos de exceção que não estejam em branco (se deixados em branco, os campos de exceção não farão nada).

O campo `Título extraído` corresponde de duas maneiras:

* Com base no `ID de exceção` (encontrado executando o analisador de teste). Por exemplo, se o jogo fosse `Portal 1` e seu `ID de exceção` fosse `12345`, você poderia colocar `Portal 1 ${id:12345}`. Se o `ID de exceção` estiver presente, não importa qual rótulo você coloca na frente dele, mas para facilitar a leitura e a pesquisa, é bom colocar o nome real do jogo na frente do `ID de exceção`.
* Com base no `Título Extraído` (encontrado executando o analisador de teste). Por exemplo, se o `Título Extraído` fosse `Portal 2` você colocaria `Portal 2`.

Assim, você pode ter uma exceção que se aplica a todos os jogos com o mesmo nome ou uma exceção que se aplica apenas a um jogo exato (os `IDs de exceção` são únicos). A razão para isso é principalmente a compatibilidade com versões anteriores -- o SRM anteriormente correspondia apenas ao `Título extraído`.

As exceções geradas em `Adicionar Jogos` sempre estarão no formato `Título extraído ${id:XXXXXX}`.

## Embed Html Callback

Este é o título que será exibido na Steam. Não será usado para procurar imagens.

## Novo título de pesquisa

Este é o título que será usado para procurar imagens no [SteamGridDB](https://www.steamgriddb.com). Há duas opções para substituí-lo:

* Especifique o novo título de pesquisa como o texto que você quiser.
* Especifique o Id exato do jogo para puxar imagens. Por exemplo, para obter imagens para o jogo [Flow](https://www.steamgriddb.com/game/5254019) que tem a url SteamGridDB `https://www. teamgriddb.com/game/5254019` você colocaria `${gameid:5254019}`.

## Novo Artigos de linha de comando

Argumentos personalizados de linha de comando como `--fullscreen`, etc, que podem ser aplicados a um título específico. Estas substituem apenas o campo de argumentos do atalho Steam e nunca são anexados ao executável.

## Excluir Título

A capacidade de excluir títulos individuais de serem adicionados à Steam. Isso permite que você mantenha títulos que você não quer na Steam na mesma pasta que os outros jogos.

## Apenas Arte Local

Não buscar arte de provedores remotos (por exemplo, [steamgriddb](https://www.steamgriddb.com)). Útil quando o SGDB corresponde incorretamente ao jogo ou você simplesmente não gosta de nenhuma arte disponível para ele.

## Variáveis personalizadas
A tarefa de substituir títulos específicos também pode ser realizada editando manualmente o arquivo JSON personalizado e usando variáveis apropriadas no campo analisador de `Modificador de Título`. No entanto, é recomendável que você usa essa ferramenta, em vez disso, já que o arquivo JSON de variáveis personalizadas será atualizado ao longo do tempo e suas edições poderão ser substituídas.
