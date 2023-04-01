## 环境变量
这些变量已经预解析，可以在 Rom 目录、Steam 目录、可执行文件位置和启动目录字段中使用。
|         变量 (大小写不敏感) | 对应的值                        |
| -------------------:|:--------------------------- |
|              `${/}` | 系统特定的目录分隔符：`\` 或 `/`       |
|         `${srmdir}` | 便携式 SRM 可执行文件目录             |
| `${steamdirglobal}` | 全局 Steam 目录，指定在`设置`中。       |
|  `${romsdirglobal}` | 全局 ROMs 目录，位于`设置`中指定。       |
|  `${retroarchpath}` | Retroarch 可执行文件的路径，在`设置`中指定 |
|        `${racores}` | RetroArch cores 目录，指定在`设置`中 |
| `${localimagesdir}` | 本地图像目录，指定在`设置`中的目录          |


The utility of the environment variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
