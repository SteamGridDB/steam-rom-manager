# 用户异常
## 不要用于什么
这个工具可以用来定义每个应用程序的异常情况，这些异常情况会覆盖解析器。 它不应该用于完成批量任务。 例如，从标题中删除冒号字符可以通过标题修改器 `${/:/|${title}|}` 实现，不应在此处执行。 如果一个命令行参数适用于每个解析的应用程序，请使用命令行参数字段 - 不要在此处创建一堆条目！

## 提取的标题 - *必填*
唯一必填的例外字段是`提取的标题`。 Once this is specified and the exception is saved, any game that matches will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing).

The `Extracted Title` field matches in two ways:

* Based on the `Exception ID` (found by running test parser). For example if the game were `Portal 1` and its `Exception ID` was `12345` then you might put `Portal 1 ${id:12345}`. If the `Exception ID` is present then it doesn't matter what label you put in front of it, but for readability and searchability it's nice to put the game's actual name in front of the `Exception ID`.
* Based on the `Extracted Title` (found by running test parser). For example if the `Extracted Title` were `Portal 2` you would put `Portal 2`.

Thus you can either have an exception that applies to all games with the same name or an exception that applies only to an exact game (`Exception ID`s are unique). The reason for this is primarily backwards compatibility -- SRM formerly matched only on the `Extracted Title`.

Exceptions generated from `Preview` will always be in the form `Extracted Title ${id:XXXXXX}`.

## 新的显示标题

This is the title that will display in Steam. It will not be used to search for images.

## 新搜索标题

This is the title that will be used to search for images on [SteamGridDB](https://www.steamgriddb.com). There are two options for overriding it:

* Specify the new search title as whatever text you want.
* 请指定要提取图像的确切游戏 ID。 例如，要获取游戏 [Flow](https://www.steamgriddb.com/game/5254019) 的图像，其 SteamGridDB 网址为 `https://www.steamgriddb.com/game/5254019`，您需要输入 `${gameid:5254019}`。

## 新的命令行参数

自定义命令行参数，例如 `--fullscreen` 等，可应用于特定的标题。 These only override the arguments field of the Steam shortcut and are never appended to the executable.

## 排除标题

从 Steam 中排除个别游戏的能力。 这样可以让你把不想在 Steam 中显示的游戏标题和其他游戏放在同一个文件夹里。

## 仅限本地艺术作品

不要从远程提供程序(例如 [steamgriddb](https://www.steamgriddb.com) )获取艺术作品。 Useful when SGDB is incorrectly matching the game or you just don't like any of the artwork available for it.

## 自定义变量
覆盖特定标题的任务也可以通过手动编辑自定义变量 JSON 文件并在`标题修改器`解析器字段中使用适当的变量来完成。 然而，建议您使用此工具，因为自定义变量 JSON 文件将随时间更新，并且您的编辑可能会被覆盖。
