# Title modifier `[supports variables]`{.noWrap}

Default value is `${fuzzyTitle}`{.noWrap}. This setting can be used to prepend or append desired characters to a title which will be added to Steam. For example, given that `${fuzzyTitle}`{.noWrap} is `Zelda 2`, you can add ` (1.7.5)` to it by setting value to:

```
${fuzzyTitle} (1.7.5)
```

You can use `${title}`{.noWrap} or any other variable to construct the final title.

This setting influences Steam's APP ID.
