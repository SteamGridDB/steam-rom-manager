# Special glob characters

## Wildcards: `*`, `?`, `[...]`{.noWrap}

- `*` -- matches **0** or **more** characters in a **single** path portion;
- `?` -- matches exactly **1** character;
- `[...]`{.noWrap} -- matches a range of characters. If the first character in brackets is `!` or `^` then it matches any character not in the range:
  - `[abc]`{.noWrap} -- matches `a`, `b` or `c` characters;
  - `[!abc]`{.noWrap} -- matches any character except for `a`, `b` or `c`;
  - `[0-9]`{.noWrap} -- matches any character between `0` and `9` characters (all numbers);
  - `[a-z]`{.noWrap} -- matches any character between `a` and `z` characters (lower english alphabet).

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
| :----------------------------------- | ----------------------: |
| `@(dir[12]\|DIR)/**/*.txt`           |      `1`, `2`, `4`, `5` |
| `!(dir[12]\|DIR)/**/*.txt`           |                `3`, `6` |
| `*/!(*bb*)/*.txt`                    |      `2`, `3`, `4`, `5` |
| `*/?(abc)/*.txt`                     |                     `4` |
| `*/+(abc)/*.txt`                     |                `4`, `5` |
| `*([a-zA-Z])/*/*.txt`                |                `4`, `5` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |      `2`, `3`, `4`, `5` |
| `*([a-zA-Z])+([0-9])/*/${title}.txt` |           `2`, `3`, `6` |
| `*([a-zA-Z])*([0-9])/*/${title}.txt` | `2`, `3`, `4`, `5`, `6` |

## Braced sets: `{...}`{.noWrap}

It is a way to make more glob pattern sets out of one set. Braced set starts with `{` and ends with `}`, with any number of comma-delimited sections within (nested braced sets are allowed). For example, `C:/dir1/{dir2,dir3/dir4}/file.txt` will expand to:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/dir4/file.txt`

Braced sets also have less useful range syntax `{x..x}` where `x` is a single character. For example, `C:/dir1/dir{2..4}/file.txt` will expand to:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/file.txt`
- `C:/dir1/dir4/file.txt`

Braced set is expanded **before** actual parsing, therefore can be useful to generate different subdirectories or even [extended glob matchers](#extended-glob-matchers). For example, `C:/+(a|{b),c)}/file.txt` would expand to:

- `C:/+(a|b)/file.txt`
- `C:/+(a|c)/file.txt`
