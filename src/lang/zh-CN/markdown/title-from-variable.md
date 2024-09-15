# 自定义变量的标题（可选）

允许使用自定义变量覆盖提取的标题。 这是在提取标题之后立即完成的，这意味着替换后的标题可以用于模糊匹配等操作。 群组和变量本身是**区分大小写**的，除非启用了不区分大小写的变量选项。

标题匹配可以限制在特定的自定义变量组中。 为了指定组，必须使用以下语法：

```
${...}
```

例如，这是如何为“RPCS3”和“rpcs3”指定群组的方法：

```
${RPCS3}${rpcs3}
```

请确保您 **将开关打开**。

## 不区分大小写选项

如果启用了此选项，则将执行不区分大小写的匹配，并使用第一个匹配的自定义变量。

## 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 注意! 该功能是**实验性的**。

基本上，它可能会在未来的版本中更改（但很不可能）。 此外，目前唯一添加变量的方法是创建/编辑 SRM 直接使用的 `customVariables.json`。

该文件应位于 SRM 的 `userData` 目录中。

除非使用以下 JSON 结构，否则 SRM 将会抛出错误：

```
{
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    {
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    {
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    {
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    {
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Joint Strike",
        ...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend Of Link"
    },
    ...
}
}
}
}
}
```

如果您的用户全局变量是 `MyDir/${title}.wad`，并且您在 `MyDir` 中有一个名为 `The Legend of Zelda.wad` 的文件，则可以将标题从自定义变量字段设置为 `${Custom Stuff}` 以获得最终标题 “The Legend of Link”。
