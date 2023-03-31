# 模糊匹配

将对[SteamGridDB](http://www.steamgriddb.com/)提供的标题列表进行模糊匹配。 它将尝试填补标题中缺失的字符，从而增加找到图片的概率。

Fuzzy titles are available as title modifiers via `${fuzzyTitle}`. Currently fuzzy matching is only enabled for `ROM Parsers` and `Manual Parsers`.

It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).

## Replace diacritic characters

Replaces diacritic characters to their latin equivalent: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Might improve the matching ability of fuzzy matcher.

## Aggressive matching

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher.

## Remove (...) and [...] brackets

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly.
