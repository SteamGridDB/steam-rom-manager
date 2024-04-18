# 手动解析器特定输入

## 清单目录 `[支持环境变量]`{.noWrap}

您想将其转换为 Steam 快捷方式的 JSON 文件位置。 `清单目录` 应该是以下形式：

```
/path/to/manifests
--manifest1.json
--manifest2.json
--manifest3.json
...
```
文件的名称并不重要。 重要的是每个 `manifest.json` 文件都只有一个标题，如下所示：
```json
{
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args",
    "appendArgsToExecutable": false
}
```
或者是标题列表，像这样：
```json
[
  {
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args".
    "appendArgsToExecutable": true
  },
  {
    "title": "gameTitle2",
    "target": "game2/path/target.sh",
    "startIn": "game2/path",
    "launchOptions": "--args2",
    "appendArgsToExecutable": false
  }
]
```

一个典型的用例是每种游戏类型或每年代使用一个 json 文件。

Just like for ROM parsers, `appendArgsToExecutable` determines whether `launchOptions` are appended to the shortcut `target` or appear separately as launch options in steam.
