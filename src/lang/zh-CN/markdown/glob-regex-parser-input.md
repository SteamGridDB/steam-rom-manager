# Glob-regex Parser Specific Inputs

## 用户的 glob-regex

这是您创建从文件路径提取标题的 glob 的位置。 如果您不知道如何构建通配符，请阅读所有的 [特殊通配符](#special-glob-characters)。

## 它是如何工作的？

In addition to special glob characters, glob parser requires you to enter `${/.../}`{.noWrap} variable. Parser will locate it's position inside your  glob, for example: 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将定位其位置在您的全局变量中，例如： 解析器将找到它在全局变量中的位置，例如：

| 用户的 glob              | 位置         |
| --------------------- | ---------- |
| `${/.+/}/*/*.txt`     | 从左边开始的第一层级 |
| `{*,*/*}/${/.+/}.txt` | 从右边开始的第一层级 |
| `**/${/.+/}/*.txt`    | 从右边开始的第二层级 |

获得 `${/.../}`{.noWrap} 位置后，`${/.../}`{.noWrap} 将被替换为通配符 `*`。

## 正则表达式后处理

After title extraction, title will be processed by a regular expression. 有三种方法可以编写正则表达式。 有三种方法可以编写正则表达式。

### 不带捕获的正则表达式：`${/.+/}`{.noWrap}

这几乎与 “Glob” 解析器完全相同 -- 每个提取的标题片段都将被使用。

### 带有捕获括号的正则表达式：`${/(.+)/}`{.noWrap}

允许多个匹配和捕获组。 例如，这里有2个匹配组和多个捕获组：
```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```
从左到右，第一个匹配所有正确捕获的分组将被使用。 First match group (from left to right) with all correct captures will be used. 此外，所有捕获组将被**合并**。

### 带有捕获括号和替换文本的正则表达式：`${/(.+)/|...}`{.noWrap}

Similar to [regular expression with capture brackets](#regular-expression-with-capture-brackets) except for how it handles captured groups. 替换文本可以用于移动捕获的组。 替换文本可以用于移动捕获的组。 例如：
```
${/(.*?)\s*\[USA\]\s*(.+)/|Second capture group: "$2" precedes the first one, which is "$1" }
```
如果我们的第一个捕获组是 `Legend of Zelda`，第二个捕获组是 `SUPER EDITION`，那么我们将得到以下（不太有用）的标题：

`第二个捕获组："SUPER EDITION" 在第一个捕获组 "Legend of Zelda" 之前。`

未经处理的文本将保持默认状态，因此如果您看到一些尾随字符，请确保在正则表达式末尾添加 `.*` 或在开头添加 `.*?`。

### 支持的标志

允许的标志是 `i`，`g` 和 `u`。

## 限制

位置提取存在一些限制 -- 如果无法提取位置，则 glob 无效。 Position extraction comes with some limitations -- glob is invalid if position can not be extracted. Most of the time you will be warned about what you can't do, however, if you find a combination that is allowed, but produces incorrect titles please make an issue at [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
