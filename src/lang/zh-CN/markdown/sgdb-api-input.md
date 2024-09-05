## 图像提供程序 API 选项

这组选项是直接输入到图像提供程序的 API 中，例如 SteamGridDB 的 [API](https://www.steamgriddb.com/api/v2)。

An interesting quirk of these settings is that re-generating the game list in Add Games (hitting the `Refresh` button) *will only add artwork*, not remove it. If one wants to apply a stronger set of filters and remove artwork, one has to hit the `Remove from Steam` button in Add Games before hitting `Refresh`. 这种行为的原因是它允许进行*优先*艺术作品选择。 例如，可以先使用模糊网格过滤器生成游戏列表，然后再关闭该过滤器重新生成图像，以实现*优先*模糊网格的效果，但是在不存在模糊网格的情况下仍允许非模糊网格。

## SteamGridDB

* 允许 NSFW 艺术作品 - 你懂的。
* 允许开玩笑的艺术作品 - 你懂的。
* 允许的网格样式 - Alternate、Blurred、白色标志、Materiel或无标志。 适用于海报和横幅网格。
* 允许的主页风格 - Alternate、Blurred、Materiel。
* 允许的 Logo 样式 - 官方，白色，黑色，自定义。
* 允许的图标样式 - 官方、自定义。
* 允许的动画类型 - 静态 (`.png`,`.ico`等)，动画 (`.webp`)。
