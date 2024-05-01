# EA Desktop Parser Specific Inputs

## EA Games 目录覆盖
默认情况下，Steam ROM Manager 假定您的 `EA Desktop` 游戏已安装在 `C:\Program Files\EA Games\。 该字段允许您更改游戏安装的位置，例如`D:\Games\EA Games。

## 通过 EA Desktop 启动游戏
如果启用了 SRM，它将添加一个快捷方式到 `origin2://game/launch/?offerIds=${gameid}` 而不仅仅是游戏的可执行文件。 这将确保游戏通过 EA 启动，并且可以访问在线服务。

`需要这个才能添加 EA Play 游戏。 如果未切换此选项，则无法检测到 EA Play 游戏。`
