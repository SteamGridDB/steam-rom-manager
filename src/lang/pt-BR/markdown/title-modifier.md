# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

Defaults to `${fuzzyTitle}`{.noWrap} if field is unset. This setting can be used to prepend or append desired characters to a Steam shortcut's `Title`. Por exemplo, dado que `${fuzzyTitle}`{.noWrap} é `Zelda 2`, você pode adicionar `(1..5)` definindo o valor para:

```
${fuzzyTitle} (1.7.5)
```

Você pode usar `${title}`{.noWrap} ou qualquer outra variável para construir o título final.

Esta configuração é usada para influenciar o ID APP do Steam.
