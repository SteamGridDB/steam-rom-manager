# Executável `[aceita variáveis env]`

Caminho para o executável do emulador. Pode ser um arquivo ou qualquer caminho de sistema válido.

## Por que opcional?

Em alguns casos, você pode querer executar o jogo a partir de um arquivo de lote que também executará automaticamente o emulador. Se for esse o caso, então é desnecessário fornecer executável.

O atalho final será `"${filePath}" --command-line-args`.

### Então, como eu adiciono arquivos ao Steam sem o executável padrão?

Todos os arquivos recuperados por um analisador serão tratados como executáveis em vez disso.
