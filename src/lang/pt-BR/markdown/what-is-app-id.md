# Qual é o ID APP do Steam?

O Steam usa o APP ID para identificar jogos. Para outros jogos que não sejam gerados usando:

- Executar;
- Título do aplicativo final.

Se você usar `RetroArch` ou emuladores similares para adicionar o mesmo jogo, mas em diferentes consoles, você encontrará um problema onde apenas **um** título é adicionado e outros simplesmente desaparecem. Isto é devido a IDs de apps duplicados.

## Adicionar títulos idênticos de diferentes consoles

O Steam APP ID não pode ser idêntico. Isso pode ser alcançado alterando o valor do modificador de **Título** ou ativando **Acrescentar argumentos para executáveis**. A segunda opção adiciona uma terceira variável para o APP ID:

- Executar;
- Título do aplicativo final;
- Parâmetros da linha de comando.

A maior parte da linha de comando contém um caminho único de jogo que deve permitir a geração de IDs únicos de APP.
