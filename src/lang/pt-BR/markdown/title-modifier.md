# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

O padrão é `${fuzzyTitle}`{.noWrap} se o campo não estiver definido. Esta configuração pode ser usada para adicionar ou acrescentar caracteres desejados ao `Título` de um atalho do Steam. Por exemplo, dado que `${fuzzyTitle}`{.noWrap} é `Zelda 2`, você pode adicionar `(1..5)` definindo o valor para:

```
${fuzzyTitle} (1.7.5)
```

Você pode usar `${title}`{.noWrap} ou qualquer outra variável para construir o título final.

Esta configuração é usada para influenciar o ID APP do Steam.
