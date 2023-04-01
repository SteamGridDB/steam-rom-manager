# 模糊匹配

将对 [SteamGridDB](http://www.steamgriddb.com/) 提供的标题列表进行模糊匹配。 它将尝试填补标题中缺失的字符，从而增加找到图片的概率。

Fuzzy titles are available as title modifiers via `${fuzzyTitle}`. Currently fuzzy matching is only enabled for `ROM Parsers` and `Manual Parsers`. Currently fuzzy matching is only enabled for `ROM Parsers` and `Manual Parsers`. 目前模糊匹配仅适用于`ROM 解析器`和`手动解析器`。 目前模糊匹配仅适用于 `ROM 解析器` 和 `手动解析器`。

It is possible, that `false` matching might occur for titles that are not in the list. It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues). It is possible, that `false` matching might occur for titles that are not in the list. If you encounter missing titles, feel free to post an issue on [github](https://github.com/FrogTheFrog/steam-rom-manager/issues). 如果你遇到缺失的标题，请随时在 [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues) 上发布问题。

## 替换变音符号字符

Replaces diacritic characters to their latin equivalent: `Ą` -> `A`, `Ę` -> `E`, `Ė` -> `E`, etc. Might improve the matching ability of fuzzy matcher. Might improve the matching ability of fuzzy matcher. 可能会提高模糊匹配器的匹配能力。 可能会提高模糊匹配器的匹配能力。

## 积极匹配

When enabled, fuzzy matcher will remove all characters except for `a-zA-Z0-9 ()[]` and will replace `_` with space. This should improve the matching ability of fuzzy matcher. This should improve the matching ability of fuzzy matcher. 这应该会提高模糊匹配器的匹配能力。 这应该会提高模糊匹配器的匹配能力。

## 删除 (...) 和 [...] 括号

When enabled, fuzzy matcher will remove all `(...)`{.noWrap} and `[...]`{.noWrap} together with their content. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly. Useful for titles with `[USA]`{.noWrap}, `[JPN]`{.noWrap} and etc., as they prevent from matching titles correctly. 适用于带有`[USA]`{.noWrap}，`[JPN]`{.noWrap}等的标题，因为它们可以防止正确匹配标题。 适用于带有 `[USA]`{.noWrap}，`[JPN]`{.noWrap} 等的标题，因为它们可以防止正确匹配标题。
