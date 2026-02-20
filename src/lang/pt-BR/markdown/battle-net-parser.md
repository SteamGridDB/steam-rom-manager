# Analisador Battle.net

Este analisador importa jogos do aplicativo `Battle.net`, para que a arte possa ser escolhida para eles e adicionados ao Steam. Se não funcionar, é porque a Blizzard alterou a estrutura de seus arquivos de banco de dados. Nesse caso, informe os desenvolvedores do SRM e resolveremos o problema.

O analisador `Battle.net` é um pouco especial porque usa um script shell em `${srmDir}/scripts/bnet.ps1` para iniciar o `Battle.net`, aguarda um tempo apropriado e somente depois disso inicia o título real.
