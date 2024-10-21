# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

O valor padrão é `${exePath}`{.noWrap}. Esta configuração pode ser usada para antecipar ou anexar caracteres desejados a um executável que será adicionado à propriedade Steam (`Target`). Por exemplo, dado que `${exePath}`{.noWrap} é `C:\RetroArch\retroarch. xeque`, você pode adicionar `"cmd" /k start /min` definindo o valor para:

```
"cmd" /k start /min "${exePath}"
```

Você pode usar qualquer outra variável para construir o executável final.

Esta configuração é usada para influenciar o ID APP do Steam.

## Shortcut Passthrough

Se você ativar "Seguir .lnk para destino" e o seu executável é um ". arquivo nk", ou seja, um atalho, então tudo o que você colocar neste campo será sobrescrito com o alvo desse atalho. Se você gostaria de adicionar argumentos executáveis adicioná-los ao alvo do atalho ou use o campo "Argumentos de Linha de Comando" no analisador.
