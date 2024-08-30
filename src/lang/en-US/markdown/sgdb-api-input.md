## Image provider API options

This set of options are direct inputs into the APIs of image providers, for example SteamGridDB's [API](https://www.steamgriddb.com/api/v2).

An interesting quirk of these settings is that re-generating the game list in Add Games (hitting the `Refresh` button) _will only add artwork_, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove from Steam` button in Add Games before hitting `Refresh`. The reason for this behavior is that it allows for _preferential_ artwork selection. For example, one might first generate the game list with the blurred grid filter on and then re-generate it with the blurred grid filter off in order to achieve the effect of _preferring_ blurred grids, but still allowing non-blurred grids in the case no blurred grid exists.

## SteamGridDB

- Allow NSFW artwork - self-explanatory.
- Allow joke artwork - self-explanatory.
- Allowed grid styles - Alternate, Blurred, White Logo, Materiel, or No Logo. Applies to posters and to banner grids.
- Allowed hero styles - Alternate, Blurred, Materiel.
- Allowed logo styles - Official, White, Black, Custom.
- Allowed icon styles - Official, Custom.
- Allowed animation types - Static (`.png`,`.ico`, etc), Animated (`.webp`).
