## 环境变量

这些变量已经预解析，可以在 Rom 目录、Steam 目录、可执行文件位置和启动目录字段中使用。
| 变量 (大小写不敏感) | 对应的值 |
| -------------------:|:--------------------------------------------- |
| `${/}` | 系统特定的目录分隔符：`\` 或 `/` |
| `${srmdir}` | 便携式 SRM 可执行文件目录 |
| `${steamdirglobal}` | 全局 Steam 目录，指定在 `设置` 中。 |
| `${accountsglobal}` | Global user accounts, specified in `Settings` |
| `${romsdirglobal}` | 全局 ROMs 目录，位于 `设置` 中指定。 |
| `${retroarchpath}` | Retroarch 可执行文件的路径，在 `设置` 中指定 |
| `${racores}` | RetroArch cores 目录，指定在 `设置` 中 |
| `${localimagesdir}` | 本地图像目录，指定在 `设置` 中的目录 |

环境变量 `${srmdir}` 的实用性在于使 SRM 完全可移植，例如，如果您想要具有目录布局 `D:\Games\Roms` 和 `D:\Games\PortableSRM\SRM.exe`，那么将 Roms 目录字段设置为 `${srmdir}${/}..${/}Roms` 将允许您将游戏目录移动到其他地方而不会破坏设置。
