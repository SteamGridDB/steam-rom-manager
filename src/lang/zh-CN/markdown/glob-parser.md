# 通配解析器

一个基于通配符的路径解析器，用于从文件路径中提取标题。

如果您的 ROM 目录（例如`D:\ROMS`）包含`Donkey Kong.gba`，`Super Mario.gba`和`Sonic.gba`，那么glob `${title}.gba` 将找到标题为`Donkey Kong`, `Super Mario`和`Sonic`。
