# Entradas específicas do EA Desktop Parser

## Sobreposição do diretório EA Games
Por padrão, Steam ROM Manager assume que seus jogos do ``EA Desktop<code> estão instalados em <0>C:\Program Files\EA Games\`. Esse campo permite que você mude para qualquer dos seus jogos que estão instalados, e.g.``D:\Games\EA Games`.

## Iniciar jogos via EA Desktop
Se habilitado, SRM irá adicionar um atalho para`origin2://game/launch/?offerIds=${gameid}` ao invés de apenas o executável do jogo. Isso garante que o jogo inicie via EA e que terá acesso aos serviços online.

`Isso é necessário para adicionar jogos EA Play. Jogos EA Play não serão detectados se isso não estiver marcado.`
