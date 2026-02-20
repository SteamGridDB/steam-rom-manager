# Entradas específicas do analisador Legendary

## Substituição do caminho Legendary

Por padrão, o Steam ROM Manager usa `(Get-Command legendary).Path` no Windows e `which legendary` no Linux e Mac para determinar a localização do seu executável Legendary. Este campo permite substituir esse caminho.

Especificar a localização correta do executável Legendary só é necessário se você ativar a inicialização via Legendary (veja abaixo), caso contrário, o SRM não precisará da localização do executável Legendary.

## Substituição do caminho `installed.json` Legendary

A maioria dos usuários não deveria usar isso, pois usam a instalação padrão do `Legendary`, onde o manifesto dos jogos instalados estará localizado em `~/.config/legendary/installed.json`.

Se, no entanto, por algum motivo o manifesto dos jogos instalados estiver localizado em um local atípico, você poderá especificar o caminho correto do manifesto aqui.

## Inicia via Legendary `[Recomendado ativado]`

Ao que parece, essa alternância determina se os jogos serão iniciados via Legendary ou diretamente. A inicialização via Legendary fornece acesso aos serviços online da Epic.
