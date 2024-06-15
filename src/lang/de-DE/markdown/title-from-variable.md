# Title from custom variable (optional)
Allows one to overwrite the extracted title with a custom variable, pulled from the `json` files described below. This happens right after title extraction, meaning that the new title can be used for fuzzy matching and so on. Gruppen und Variablen beachten Groß- und Kleinschreibung, außer etwas anderes ist aktiviert.

Title matching is limited to specific groups of custom variables. For example, this is how you specify groups "FBN" and "PSN":
```
${RPCS3}${PSN}
```

# How it works
There are two variable files, `customVariables.json` which is maintained by SRM (don't change this one, your changes will be overwritten every time SRM restarts) and `userVariables.json` which is where you should put your own variables. Both files are located in SRM's `Config Directory`.



Both `customVariables.json` and `userVariables.json` have the same JSON structure. SRM benötigt die folgende Struktur:

```
{
    "Group1": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Group2": {
        "The Legend Of Zelda": "The Legend Of Link",
        ...
    },
    ...
}
```

Then if your user glob were `romsdir/${title}.wad` and you had a `The Legend of Zelda.wad` located in `romsdir`, you would set the title from custom variable field to `${Group2}` to obtain a title of "The Legend of Link".

## Case-insensitive variables
If enabled, case-insensitive matching will be done and first matched custom variable will be used.

## Skip file if variable not found
If enabled, titles that don't match a variable will be excluded.