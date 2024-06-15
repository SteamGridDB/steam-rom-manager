# Analisador de Battle.net

Este analisador importa jogos do aplicativo `Battle.net`, para que a arte possa ser escolhida para eles e eles possam ser adicionados ao Steam. Se não funcionar, é porque a Blizzard alterou a estrutura de seus arquivos de banco de dados, caso em que por favor avise os desenvolvedores da SRM e resolveremos o problema.

O analisador `Battle.net` é um pouco especial na medida em que usa um script shell em `${srmDir}/scripts/bnet.ps1` para lançar o `Battle.net`, aguarda um tempo apropriado e somente depois disso lança o título real.
