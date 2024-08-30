# Steam category (optional) `[supports variables]`{.noWrap}

Also known as "tags", can be used to group apps in Steam. In order to set Steam category, the following syntax must be used:

```
${...}
```

For example, this is how you specify categories for "WII" and "GBA" (paired with "ROMS") category:

```
${WII}
```

```
${GBA}${ROMS}
```

This how "WII" category will look like in Steam:

![steamCategory](../../../assets/images/category-example.png)

## Emojis and non-Standard Unicode Characters

Please not that this field works just fine with emojis like `🎮` work just fine in category names.

You can find a list of them here: [https://copychar.cc/](https://copychar.cc/)
