# 本地图片`[支持变量]`{.noWrap}

允许使用本地存储的图像。 使用一个[特殊的搜索匹配模式输入](#special-glob-input)字符串来查找图像，例如可以填写 `/path/to/heroes/${title}.@(png|jpg)`。 可以使用反斜杠对字符进行转义。例如，如果图像存放在 `artwork [portraits]` 目录中，可以填写 `/path/to/artwork \[portraits\]/${title}.@(png|jpg)`。 建议在全局设置中指定艺术作品目录，然后在此字段中使用 `${localimages}` 目录环境变量，例如：`${localimagesdir}/emuname/heroes/${title}.@(png|jpg)`。

您在此字段中使用的任何包含特殊全局字符的变量都将转义这些字符。

## 允许的图片扩展名

仅支持 `JPEG`{.noWrap}、`JPG`{.noWrap}、`PNG`{.noWrap}和`TGA`{.noWrap} 文件扩展名。 即使解析器发现其他扩展名的文件，它们也不会包含在最终列表中。

## 你能在保存应用程序列表后移动本地图像目录吗？

是的，一旦列表保存，本地图像将被复制到 Steam 目录中，并重命名以匹配 Steam 的 APP ID。
