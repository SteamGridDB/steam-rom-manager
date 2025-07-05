# Glob 解析器特定输入

## 用户的通配符

这是您创建从文件路径提取标题的 glob 的位置。 如果您不知道如何构建通配符，请阅读所有的 [特殊通配符](#special-glob-characters)。

## 它是如何工作的？

除了特殊的 glob 字符外，glob 解析器还要求您输入 `${title}`{.noWrap} 变量。 解析器将定位其位置在您的 **glob** 中，例如：

| 用户的glob                | 位置         |
| ---------------------- | ---------- |
| `${title}/*/*.txt`     | 从左边开始的第一层级 |
| `{*,*/*}/${title}.txt` | 从右边开始的第一层级 |
| `**/${title}/*.txt`    | 从右边开始的第二层级 |

获得 `${title}`{.noWrap} 位置后，`${title}`{.noWrap} 将被通配符 `*` 替换。

## 限制

位置提取存在一些限制 -- 如果无法提取位置，则 glob 无效。 但是，如果您发现一种允许的组合却产生了不正确的标题，请在[GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues)上提出问题。
