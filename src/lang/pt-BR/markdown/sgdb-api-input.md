## Imagem do provedor API opções

Este conjunto de opções são entradas diretas para as APIs dos provedores de imagem, por exemplo SteamGridDB's [API](https://www.steamgriddb.com/api/v2).

An interesting quirk of these settings is that re-generating the game list in Add Games (hitting the `Refresh` button) *will only add artwork*, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove from Steam` button in Add Games before hitting `Refresh`. A razão para esse comportamento é que ele permite a seleção de arte *preferencial*. For example, one might first generate the game list with the blurred grid filter on and then re-generate it with the blurred grid filter off in order to achieve the effect of *preferring* blurred grids, but still allowing non-blurred grids in the case no blurred grid exists.

## SteamGridDB

* Permitir arte NSFW - auto-explicativa.
* Permitir arte da piada - auto-explicativa.
* Estilos de grade permitidos - Alterna, borrado, logotipo branco, material ou sem Logo. Aplica-se aos cartazes e às grades de estandarte.
* Estilos de herói permitidos - Alternate, desfocado, Material.
* Estilos de logotipo permitidos - Oficial, Branco, Preto, Personalizado.
* Estilos de ícones permitidos - Oficial, Personalizado.
* Tipos de animação permitidos - Estática (`.png`,`.ico`, etc), Animado (`.webp`).
