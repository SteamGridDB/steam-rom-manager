## 常规设置
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### 离线模式 `[建议禁用]`
启用 SRM 后不会进行任何网络请求，如果您只想使用 SRM 本地图片，则非常有用。
### 在测试解析器之前自动清除日志`[建议启用]`
当启用时，每次测试解析器时日志都会被清除。
## Add Games
### 默认显示当前的 Steam 图片`[建议启用]`
启用此设置后，SRM 将默认使用 Steam 中当前给定应用程序的艺术作品。 如果禁用了，那么每次运行（和保存）SRM 时所有艺术作品都将被重置。
### 删除已禁用的解析器快捷方式`[建议禁用]`
启用禁用解析器并运行 SRM 将删除所有已添加的禁用解析器的条目和艺术作品。 如果您希望 Steam 库与启用的解析器一一对应，则此功能非常有用。
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## 模糊匹配器设置
### 日志匹配结果 `[推荐禁用]`
启用后，模糊标题匹配器在`事件日志`中会显示更详细的日志。 用于调试不正确的模糊匹配。
### 重置模糊列表
将用于模糊匹配的标题存储列表重置为由 `SteamGridDB` 返回的标题列表（删除任何用户添加的标题）。
### 重置模糊缓存
清除模糊匹配已经看到的标题缓存（如果您对模糊列表所做的更改没有导致 SRM 中标题的更改，请尝试此操作）。
## 图像提供程序设置
### Artwork loading strategy `[Recommend Load artwork lazily]`
This is the strategy SRM uses to pull artwork thumbnails for the `Add Games` UI. If you are parsing a lot of games, `Load artwork lazily` is recommended. `Preload first artwork` will try to pull the first piece of artwork for each game in each artwork category, and `Preload all artwork` will try to pull all available artwork for each game in each artwork category. `Preload all artwork` will cause network and performance issues unless the number of games is quite small (less than `30` or so).
### 启用的提供程序
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## 社区变量和预设
### 强制下载自定义变量。
重置用于某些预设的自定义变量 JSON 文件，使其与 SRM GitHub 上当前状态相同。 如果自定义变量的 JSON 文件已损坏，则此工具非常有用。
### 强制下载自定义预设。
将解析器预设的 JSON 文件重置为 SRM Github 上的内容。 如果您的预设列表没有自动更新或已损坏，则此工具非常有用。
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
