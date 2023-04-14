# 用户异常
## 不要用于什么
这个工具可以用来定义每个应用程序的异常情况，这些异常情况会覆盖解析器。 它不应该用于完成批量任务。 例如，从标题中删除冒号字符可以通过标题修改器`${/:/|${title}|}`实现，不应在此处执行。 如果一个命令行参数适用于每个解析的应用程序，请使用命令行参数字段 - 不要在此处创建一堆条目！

## 提取的标题 - *必填*
唯一必填的例外字段是`提取的标题`。 一旦指定并保存了异常，任何`提取的标题`与之匹配的游戏都将被其非空白字段覆盖(如果留空，则异常字段不起作用)。

如果您不确定给定游戏的`提取标题`是什么，请检查测试该游戏所在解析器的输出。

## 新的显示标题

它听起来像什么。 这是将在 Steam 中显示的标题。

## 新搜索标题

有两个选项可以覆盖用于从 SteamGridDB 获取图像的标题：

* 请指定新的搜索标题。
* Specify the exact game id to pull images from. Specify the exact game id to pull images from. Specify the exact game id to pull images from. For example to get images for the game [Flow](https://www.steamgriddb.com/game/5254019) which has SteamGridDB url `https://www.steamgriddb.com/game/5254019` you would put `${gameid:5254019}`. 例如，要获取游戏 [Flow](https://www.steamgriddb.com/game/5254019) 的图像，其 SteamGridDB 网址为 `https://www.steamgriddb.com/game/5254019`，您需要输入 `${gameid:5254019}`。

## 新的命令行参数

自定义命令行参数，例如 `--fullscreen` 等，可应用于特定的标题。

## 排除标题

从 Steam 中排除个别游戏的能力。 这样可以让你把不想在 Steam 中显示的游戏标题和其他游戏放在同一个文件夹里。

## 仅限本地艺术作品

不要从远程提供程序(例如 [steamgriddb](https://www.steamgriddb.com) )获取艺术作品。 当 SGDB 错误地匹配游戏时很有用。

## 自定义变量
覆盖特定标题的任务也可以通过手动编辑自定义变量 JSON 文件并在`标题修改器`解析器字段中使用适当的变量来完成。 然而，建议您使用此工具，因为自定义变量 JSON 文件将随时间更新，并且您的编辑可能会被覆盖。
