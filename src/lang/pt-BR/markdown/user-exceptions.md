# Exceções do Usuário
## Para o que não usar isto
Esta ferramenta pode ser usada para definir por app exceções que sobrepõem os analisadores. Não deve ser utilizado para realizar tarefas em massa. Por exemplo, remover o caractere dois-pontos dos títulos pode ser feito através do modificador de título `${/:/-;${title}├}` e não deve ser feito aqui. Se um argumento de linha de comando é comum a cada app analisado, então use o campo de argumento de linha de comando - não crie um monte de entradas aqui!

## Título Extraído - *Obrigatório*
O único campo de exceção obrigatório é `Título Extraído`. (Automatic Translation). Uma vez que isso for especificado e a exceção for salva, qualquer jogo cuja `Ocorrências no Título` tenha seus campos substituídos por quaisquer campos de exceção não-vazios (se deixar em branco, os campos de exceção não fazem nada).

Se não tiver certeza do que é o `Título Extraído` para um determinado jogo, verifique a saída do teste do analisador em que o jogo está.

## Embed Html Callback

Como parece. Este é o título que aparecerá na Steam.

## Novo título de pesquisa

Existem duas opções para substituir o título usado para obter imagens do SteamGridDB:

* Especifique o novo título de pesquisa.
* Especifique o Id exato do jogo para puxar imagens. Por exemplo, para obter imagens para o jogo [Flow](https://www.steamgriddb.com/game/5254019) que tem a url SteamGridDB `https://www. teamgriddb.com/game/5254019` você colocaria `${gameid:5254019}`.

## Novo Artigos de linha de comando

Argumentos personalizados de linha de comando como `--fullscreen`, etc, que podem ser aplicados a um título específico.

## Excluir Título

A capacidade de excluir títulos individuais de serem adicionados à Steam. Isso permite que você mantenha títulos que você não quer na Steam na mesma pasta que os outros jogos.

## Apenas Arte Local

Não buscar arte de provedores remotos (por exemplo, [steamgriddb](https://www.steamgriddb.com)). Útil quando o SGDB está combinando incorretamente com o jogo.

## Variáveis personalizadas
A tarefa de substituir títulos específicos também pode ser realizada editando manualmente o arquivo JSON personalizado e usando variáveis apropriadas no campo analisador de `Modificador de Título`. No entanto, é recomendável que você usa essa ferramenta, em vez disso, já que o arquivo JSON de variáveis personalizadas será atualizado ao longo do tempo e suas edições poderão ser substituídas.
