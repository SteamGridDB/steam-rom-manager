# 特殊的全局字符

## 通配符：`*`，`?`，`[...]`{.noWrap}

- `*` -- 在**单个**路径部分中匹配**0**或**更多**字符；
- `?` -- 精确匹配 **1** 个字符；
- `[...]`{.noWrap} -- 匹配一系列字符。 如果方括号中的第一个字符是`!`或`^`，则它匹配不在范围内的任何字符：
  - `[abc]`{.noWrap} -- 匹配`a`、`b`或`c`字符；
  - `[!abc]`{.noWrap} -- 匹配除了`a`、`b`或`c`以外的任何字符；
  - `[0-9]`{.noWrap} -- 匹配`0`和`9`之间的任何字符（所有数字）；
  - `[a-z]`{.noWrap} -- 匹配 `a` 到 `z` 之间的任何字符（小写英文字母）。

## Globstar: `**`

`**` matches **0** or **more** directories and subdirectories searching for matches. If directories have a **lot** of subdirectories, it will cause performance issues. If possible, use [braced sets](#braced-sets).

## Extended glob matchers: `!(...)`{.noWrap}, `?(...)`{.noWrap}, `+(...)`{.noWrap}, `*(...)`{.noWrap}, `@(...)`{.noWrap}

It allows to specify how to use patterns made from simple characters and wildcards. More than one pattern may be specified inside `(...)`{.noWrap} and separated with `|`.

- `!(...)`{.noWrap} -- matches anything **except** one of the given pattern(s);
- `?(...)`{.noWrap} -- matches **zero** or **one** occurrence of the given pattern(s);
- `+(...)`{.noWrap} -- matches **one** or **more** occurrences of the given pattern(s);
- `*(...)`{.noWrap} -- matches **zero** or **more** occurrences of the given pattern(s);
- `@(...)`{.noWrap} -- matches **one** of the given pattern(s).

Given these files paths:

1. `dir1/file.txt`;
1. `dir2/dir3/file.txt`;
1. `dir4/111222/file.txt`;
1. `DIR/abc/file.txt`;
1. `DIR/abcabc/file.txt`;
1. `123/aabbcc/file.txt`;

here are few examples of extended glob matchers in action:

| Glob patterns                        |  Matches (list numbers) |
|:------------------------------------ | -----------------------:|
| `@(dir[12]\|DIR)/**/*.txt`          |      `1`, `2`, `4`, `5` |
| `!(dir[12]\|DIR)/**/*.txt`          |                `3`, `6` |
| `*/!(*bb*)/*.txt`                    |      `2`, `3`, `4`, `5` |
| `*/?(abc)/*.txt`                     |                     `4` |
| `*/+(abc)/*.txt`                     |                `4`, `5` |
| `*([a-zA-Z])/*/*.txt`                |                `4`, `5` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |      `2`, `3`, `4`, `5` |
| `*([a-zA-Z])+([0-9])/*/${title}.txt` |           `2`, `3`, `6` |
| `*([a-zA-Z])*([0-9])/*/${title}.txt` | `2`, `3`, `4`, `5`, `6` |

## Braced sets: `{...}`{.noWrap}

这是一种将一个集合拆分成更多全局模式集的方法。 大括号集合以`{`开头，以`}`结尾，在其中可以有任意数量的逗号分隔的部分（允许嵌套大括号集合） 例如，`C:/dir1/{dir2,dir3/dir4}/file.txt` 将会扩展为：

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/dir4/file.txt`

Braced sets also have less useful range syntax `{x..x}` where `x` is a single character. For example, `C:/dir1/dir{2..4}/file.txt` will expand to:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/file.txt`
- `C:/dir1/dir4/file.txt`

Braced set is expanded **before** actual parsing, therefore can be useful to generate different subdirectories or even [extended glob matchers](#extended-glob-matchers). For example, `C:/+(a|{b),c)}/file.txt` would expand to:

- `C:/+(a|b)/file.txt`
- `C:/+(a|c)/file.txt`
