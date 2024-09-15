## Bildanbieter-API-Einstellungen

Diese Optionen werden direkt an die APIs der Bildanbieter weitergereicht, beispielsweise SteamGridDB's [API](https://www.steamgriddb.com/api/v2).

An interesting quirk of these settings is that re-generating the preview (hitting the `Generate App List` button) _will only add artwork_, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove App List` button in preview before hitting `Generate App List`. The reason for this behavior is that it allows for _preferential_ artwork selection. For example, one might first generate the preview with the blurred grid filter on and then re-generate it with the blurred grid filter off in order to achieve the effect of _preferring_ blurred grids, but still allowing non-blurred grids in the case no blurred grid exists.

## SteamGridDB

- NSFW-Artworks erlauben.
- Scherzkunst erlauben.
- Allowed grid styles - Alternate, Blurred, White Logo, Materiel, or No Logo. Applies to posters and to banner grids.
- Allowed hero styles - Alternate, Blurred, Materiel.
- Allowed logo styles - Official, White, Black, Custom.
- Allowed icon styles - Official, Custom.
- Allowed animation types - Static (`.png`,`.ico`, etc), Animated (`.webp`).
