## Bildanbieter-API-Einstellungen

Diese Optionen werden direkt an die APIs der Bildanbieter weitergereicht, beispielsweise SteamGridDB's [API](https://www.steamgriddb.com/api/v2).

An interesting quirk of these settings is that re-generating the game list in Add Games (hitting the `Refresh` button) *will only add artwork*, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove from Steam` button in Add Games before hitting `Refresh`. Der Grund hierfür ist, dass so einfacher *preferierte* Artorks ausgewählt werden können. For example, one might first generate the game list with the blurred grid filter on and then re-generate it with the blurred grid filter off in order to achieve the effect of *preferring* blurred grids, but still allowing non-blurred grids in the case no blurred grid exists.

## SteamGridDB

* NSFW-Artworks erlauben.
* Scherzbild erlauben.
* Erlaubte Kapsel-Stile - Alternative, Verschwommene, Weißes Logo, Material oder kein Logo. Wird auf Poster und Banner Kapseln angewandt.
* Erlaubte Heldenbild-Stile - Alternativ, Verschwommen, Material.
* Erlaubte Logo-Stile - Offiziell, Weiß, Schwarz, Eigen.
* Erlaubte Symbol-Stile - Offiziell, Eigene.
* Erlaubte Animationsarten - Statisch (`.png`,`.ico`, etc), Animiert (`.webp`).
