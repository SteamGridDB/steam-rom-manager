#

. Grupos e variáveis em si são **sensíveis a maiúsculas e minúsculas**, a não ser que uma opção de variável insesitiva esteja habilitada.

.

```

```

#

. . Your handcrafted variables will take preference over SRMs defaults.

:

```
...
    ...
    ...
}
```

Then if your glob were `romsdir/${title}.wad` and you had a `The Legend of Zelda.wad` located in `romsdir`, you would set the title from custom variable field to `${Group2}` to obtain a title of "The Legend of Link".

## Separating sort-as-title from display-title
If you'd like a separate sorting title in steam, you can replace

```
    "Group1": {
        "NPUB30698": "Catherine",
        ...
    }, ...
```
by

```
    "Group1": {
        "NPUB30698": {
            "DisplayTitle": "Catherine",
            "SortAsTitle": "Catherine the Great"
        },
        ...
    }, ...
```

Note that you also have to configure the `Sort Names From Custom Variable` field in the parser; in this case you would set it to `${Group1}`.


## Variáveis insensíveis

Se esta opção estiver habilitada, a correspondência insensível a maiúsculas e minúsculas será feita e a primeira variável personalizada correspondente será usada.

## Ignorar o arquivo se a variável não foi encontrada

Se ativado, títulos que não correspondem a uma variável serão excluídos.
