## 图像提供程序 API 选项

这组选项是直接输入到图像提供程序的 API 中，例如 SteamGridDB 的 [API](https://www.steamgriddb.com/api/v2)。

An interesting quirk of these settings is that re-generating the game list in Add Games (hitting the `Refresh` button) *will only add artwork*, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove from Steam` button in Add Games before hitting `Refresh`. 这种行为的原因是它允许进行*优先*艺术作品选择。 For example, one might first generate the game list with the blurred grid filter on and then re-generate it with the blurred grid filter off in order to achieve the effect of *preferring* blurred grids, but still allowing non-blurred grids in the case no blurred grid exists.

## SteamGridDB

* 允许 NSFW 艺术作品 - 你懂的。
* 允许开玩笑的艺术作品 - 你懂的。
* 允许的网格样式 - Alternate、Blurred、白色标志、Materiel或无标志。 适用于海报和横幅网格。
* 允许的主页风格 - Alternate、Blurred、Materiel。
* 允许的 Logo 样式 - 官方，白色，黑色，自定义。
* 允许的图标样式 - 官方、自定义。
* 允许的动画类型 - 静态 (`.png`,`.ico`等)，动画 (`.webp`)。
