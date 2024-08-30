# EA Desktop 解析器特定输入

## EA Games Directory Override

默认情况下，Steam ROM Manager 假定您的 `EA Desktop` 游戏已安装在 `C:\Program Files\EA Games\。 该字段允许您更改游戏安装的位置，例如`D:\Games\EA Games。

## Launch Games Via EA Desktop

如果启用了 SRM，它将添加一个快捷方式到 `origin2://game/launch/?offerIds=${gameid}` 而不仅仅是游戏的可执行文件。 这将确保游戏通过 EA 启动，并且可以访问在线服务。

`需要这个才能添加 EA Play 游戏。 This is required to add EA Play games. EA Play games will not be detected if this is not toggled on.`
