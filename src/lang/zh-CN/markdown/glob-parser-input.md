# Glob Parser specific inputs

## User's glob

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob.

## How does it work?

In addition to special glob characters, glob parser requires you to enter `${title}`{.noWrap} variable. 解析器将定位其位置在您的**全局变量**中，例如：

| 用户的全局变量                | 位置         |
| ---------------------- | ---------- |
| `${title}/*/*.txt`     | 从左边开始的第一层级 |
| `{*,*/*}/${title}.txt` | 从右边开始的第一层级 |
| `**/${title}/*.txt`    | 从右边开始的第二层级 |

获得`${title}`{.noWrap}位置后，`${title}`{.noWrap}将被通配符`*`替换。

## 限制

位置提取存在一些限制 -- 如果无法提取位置，则 glob 无效。 大多数情况下，您会收到有关不能执行的警告。但是，如果您发现一种允许的组合却产生了不正确的标题，请在[GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues)上提出问题。
