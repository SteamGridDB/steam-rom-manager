# Title from custom variable

Allows to overwrite extracted title with a custom variable. This is done right after title extraction, meaning that the replaced title can be used for fuzzy matching and so on. Groups and variables themselves are **case-sensitive**, unless case-insesitive variable option is enabled.

Title matching can be limited to specific groups of custom variables. In order to specify groups, the following syntax must be used:

```
${RPCS3}${rpcs3}
```

# How it works

Basically, it might change in the future release (very unlikelly). Furthermore, currently the only way to add variables is to create/edit `customVariables.json` used by SRM directly. This file is/should be located in SRM's `userData` directory.

Both `customVariables.json` and `userVariables.json` have the same JSON structure. SRM will throw an error unless the following JSON structure is used:

```
{
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
    },
    ...
}
```

Then if your user glob were `MyDir/${title}.wad` and you had a `The Legend of Zelda.wad` located in `MyDir`, you would set the title from custom variable field to `${Custom Stuff}` to obtain a final title of "The Legend of Link".

## Case-insensitive option

If this option is enabled, case-insensitive matching will be done and first matched custom variable will be used.

## Skip file if variable not found

If enabled, titles that don't match a variable will be excluded.
