# Catégorie Steam (facultatif) `[prend en charge les variables]`{.noWrap}

Aussi connu sous le nom de "tags", peut être utilisé pour regrouper les applications dans Steam. Afin de définir la catégorie Steam, la syntaxe doit être suivante:

```
${...}
```

Par exemple, c'est ainsi que vous spécifiez les catégories pour "WII" et "GBA" (jumelées avec "ROMS"):

```
${WII}
```

```
${GBA}${ROMS}
```

Voici à quoi ressemblera la catégorie "WII" dans Steam:

![steamCategory](../../../assets/images/category-example.png)

## Émojis et caractères Unicode non standard

Veuillez noter que ce champ fonctionne parfaitement avec des émojis comme `🎮` dans les noms de catégories.

Vous pouvez les trouver ici: [https://copychar.cc/](https://copychar.cc/)
