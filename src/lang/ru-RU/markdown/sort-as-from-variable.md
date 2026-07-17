# Sort As from custom variable

Allows one to overwrite the Steam Custom Sort Name with a custom variable value, pulled from the `json` files described below. This happens after the final title is determined, meaning that the sort as title must match the final title name. Groups and variables themselves are **case-sensitive**.

Title matching is limited to specific groups of custom variables. For example, this is how you specify groups "RPCS3" and "PSN":

```
${RPCS3}${PSN}
```

# How it works

There are two variable files, `customVariables.json` which is maintained by SRM (don't change this one, your changes will be overwritten every time SRM restarts) and `userVariables.json` which is where you should put your own variables. Both files are located in SRM's `Config Directory`.

Both `customVariables.json` and `userVariables.json` have the same JSON structure. SRM will throw an error unless the following JSON structure is used:

```
{
    "Group1": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "CustomSortNames": {
        "Zelda II: The Adventure of Link": "Legend of Zelda 02",
        "The Legend of Zelda: A Link to the Past": "Legend of Zelda 03"
        ...
    },
    ...
}
```

Please refer to the 'Title from Custom Variable' documentation on how to get specific final titles.

Once you are happy with your final titles, if you had two entries `Zelda II: The Adventure of Link` and `The Legend of Zelda: A Link to the Past`, these can have `sortas` values set to have the titles appear next to each other in Steam in their release order, alphabetically at "L" by sorting as `Legend of Zelda 02` and `Legend of Zelda 03` respectively. These custom sort names are not visible in the library, but can be viewed by right clicking a game > Properties > Customisation > Custom Sort Name.