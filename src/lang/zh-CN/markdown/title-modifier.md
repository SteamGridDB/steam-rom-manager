# 标题修饰符`[支持变量]`{.noWrap}

默认值为 `${fuzzyTitle}`{.noWrap}。 此设置可用于在标题前缀或后缀所需的字符，这些字符将添加到 Steam 中。 例如，假设 `${fuzzyTitle}`{.noWrap} 是 `Zelda 2`，您可以通过将值设置为以下内容来添加 `(1.7.5)`:

```
${fuzzyTitle} (1.7.5)
```

您可以使用 `${title}`{.noWrap} 或任何其他变量来构建最终标题。

这个设置会影响 Steam 的应用 APP ID。
