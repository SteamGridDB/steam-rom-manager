# Glob-regex 解析器特定输入

## 用户的 glob-regex

这是您创建从文件路径提取标题的 glob 的位置。 Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob.

## 它是如何工作的？

In addition to special glob characters, glob parser requires you to enter `${/.../}`{.noWrap} variable. Parser will locate it's position inside your  glob, for example:

| User's glob           | Position                    |
| --------------------- | --------------------------- |
| `${/.+/}/*/*.txt`     | First level from the left   |
| `{*,*/*}/${/.+/}.txt` | First level from the right  |
| `**/${/.+/}/*.txt`    | Second level from the right |

After acquiring `${/.../}`{.noWrap} position, `${/.../}`{.noWrap} will be replaced with a wildcard `*`.

## Regex post-processing

After title extraction, title will be processed by a regular expression. 有三种方法可以编写正则表达式。

### 不带捕获的正则表达式：`${/.+/}`{.noWrap}

这几乎与“Glob”解析器完全相同 -- 每个提取的标题片段都将被使用。

### 带有捕获括号的正则表达式：`${/(.+)/}`{.noWrap}

允许多个匹配和捕获组。 For example, here we have 2 match groups with multiple capture groups:
```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```
First match group (from left to right) with all correct captures will be used. Furthermore, all capture groups will be **joined**.

### Regular expression with capture brackets and replacement text: `${/(.+)/|...}`{.noWrap}

Similar to [regular expression with capture brackets](#regular-expression-with-capture-brackets) except for how it handles captured groups. 替换文本可以用于移动捕获的组。 例如：
```
${/(.*?)\s*\[USA\]\s*(.+)/|Second capture group: "$2" precedes the first one, which is "$1" }
```
If our first capture group is `Legend of Zelda` and second one is `SUPER EDITION`, then we will get the following (not very useful) title:

`Second capture group: "SUPER EDITION" precedes the first one, which is "Legend of Zelda"`

Untouched text will remain by default, so if you see some trailing characters be sure to add `.*` at the end or `.*?` at the begging of regular expression.

### Supported flags

Allowed flags are `i`, `g` and `u`.

## Limitations

Position extraction comes with some limitations -- glob is invalid if position can not be extracted. Most of the time you will be warned about what you can't do, however, if you find a combination that is allowed, but produces incorrect titles please make an issue at [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
