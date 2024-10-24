# Title from custom variable

允许从下面描述的 `json` 文件中用自定义变量覆盖已提取的标题 这是在提取标题之后立即完成的，这意味着替换后的标题可以用于模糊匹配等操作 群组和变量本身是**区分大小写**的，除非启用了不区分大小写的变量选项。

标题匹配可以限制在特定的自定义变量组中。 例如，这是您指定的组 "FBN" 和 "PSN"的方式：

```
${RPCS3}${PSN}
```

# 工作原理

有两个变量文件， `customVariables.json` 由 SRM 维护(不要更改此项，每次SRM 重启时您的更改都会被覆盖) 和 `userVariables.json` 您应该在哪里设置自己的变量。 这两个文件都位于SRM的 `配置目录` 中。

`customVariables.json.json` 和 `userVariables.json` 都有相同的 JSON 结构。 除非使用以下 JSON 结构，否则 SRM 将会抛出错误：

```
{
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Group2": {
        "The Legend Of Zelda": "The Legend Of Link",
        ...
    },
    ...
}
```

如果您的用户全局变量是 `MyDir/${title}.wad`，并且您在 `MyDir` 中有一个名为 `The Legend of Zelda.wad` 的文件，则可以将标题从自定义变量字段设置为 `$${Group2}` 以获得最终标题 “The Legend of Link”。

## 不区分大小写的变量

如果启用，将完成大小写不敏感的匹配，并将使用首次匹配的自定义变量。

## 如果未找到变量，则跳过文件。

如果启用，不匹配变量的标题将被排除在外。
