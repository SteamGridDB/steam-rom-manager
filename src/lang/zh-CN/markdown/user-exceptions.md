# 用户异常
## 不要用于什么
这个工具可以用来定义每个应用程序的异常情况，这些异常情况会覆盖解析器。 它不应该用于完成批量任务。 例如，从标题中删除冒号字符可以通过标题修改器 `${/:/|${title}|}` 实现，不应在此处执行。 如果一个命令行参数适用于每个解析的应用程序，请使用命令行参数字段 - 不要在此处创建一堆条目！

## 提取的标题 - *必填*
唯一必填的例外字段是`提取的标题`。 一旦指定并保存了异常，任何匹配的游戏都将被其非空白异常字段覆盖(如果留空，则异常字段不起作用)。

`提取的标题`字段有两种匹配方式：

* Based on the `Exception ID` (found by running test parser). Based on the `Exception ID` (found by running test parser). 例如，如果游戏是 `Portal 1`，它的`异常 ID`是 `12345`，那么您可以输入 `Portal 1 ${id:12345}`. Based on the `Exception ID` (found by running test parser). 例如，如果游戏是 `Portal 1`，它的`异常 ID`是 `12345`，那么您可以输入 `Portal 1 ${id:12345}`. 如果`异常 ID`存在，那么放在它前面的标签不重要，但为了可读性和搜索性，在`异常 ID`前面加上游戏的实际名称是很好的。 Based on the `Exception ID` (found by running test parser). 例如，如果游戏是 `Portal 1`，它的`异常 ID`是 `12345`，那么您可以输入 `Portal 1 ${id:12345}`. Based on the `Exception ID` (found by running test parser). 例如，如果游戏是 `Portal 1`，它的`异常 ID`是 `12345`，那么您可以输入 `Portal 1 ${id:12345}`. 如果`异常 ID`存在，那么放在它前面的标签不重要，但为了可读性和搜索性，在`异常 ID`前面加上游戏的实际名称是很好的。 Based on the `Exception ID` (found by running test parser). 例如，如果游戏是 `Portal 1`，它的`异常 ID`是 `12345`，那么您可以输入 `Portal 1 ${id:12345}`. 如果`异常 ID`存在，那么放在它前面的标签不重要，但为了可读性和搜索性，在`异常 ID`前面加上游戏的实际名称是很好的。
* Based on the `Extracted Title` (found by running test parser). 例如，如果`提取的标题`是 `Portal 2`，您应该输入 `Portal 2`。 例如，如果`提取的标题`是 `Portal 2`，您应该输入 `Portal 2`。

因此，您可以选择适用于所有具有相同名称的游戏的异常或仅适用于确切游戏的异常(`异常 ID`是唯一的)。 这是因为主要考虑向后兼容性 -- SRM 以前仅匹配`提取的标题`。

由`预览`生成的异常将始终采用以下形式：`提取标题 ${id:XXXXXX}`。

## 新的显示标题

这是在 Steam 中显示的标题。 它不会被用来搜索图片。

## 新搜索标题

这是用于在 [SteamGridDB](https://www.steamgriddb.com) 上搜索图像的标题。 覆盖它有两个选项:

* 将新的搜索标题指定为您想要的任何文本。
* 请指定要提取图像的确切游戏 ID。 例如，要获取游戏 [Flow](https://www.steamgriddb.com/game/5254019) 的图像，其 SteamGridDB 网址为 `https://www.steamgriddb.com/game/5254019`，您需要输入 `${gameid:5254019}`。

## 新的命令行参数

自定义命令行参数，例如 `--fullscreen` 等，可应用于特定的标题。 这些只覆盖了 Steam 快捷方式的参数字段，不会附加到可执行文件中。

## 排除标题

从 Steam 中排除个别游戏的能力。 这样可以让你把不想在 Steam 中显示的游戏标题和其他游戏放在同一个文件夹里。

## 仅限本地艺术作品

不要从远程提供程序(例如 [steamgriddb](https://www.steamgriddb.com) )获取艺术作品。 当 SGDB 错误地匹配游戏或您不喜欢可用的任何艺术作品时，此功能非常有用。

## 自定义变量
覆盖特定标题的任务也可以通过手动编辑自定义变量 JSON 文件并在`标题修改器`解析器字段中使用适当的变量来完成。 然而，建议您使用此工具，因为自定义变量 JSON 文件将随时间更新，并且您的编辑可能会被覆盖。
