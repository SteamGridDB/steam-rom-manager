# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

O valor padrão é `${fuzzyTitle}`{.noWrap}. Esta configuração pode ser usada para antecipar ou anexar caracteres desejados a um executável que será adicionado à propriedade Steam (Target. Por exemplo, dado que `${fuzzyTitle}`{.noWrap} é `Zelda 2`, você pode adicionar `(1..5)` definindo o valor para:

```
${fuzzyTitle} (1.7.5)
```

Você pode usar `${title}`{.noWrap} ou qualquer outra variável para construir o título final.

Esta configuração é usada para influenciar o ID APP do Steam.
