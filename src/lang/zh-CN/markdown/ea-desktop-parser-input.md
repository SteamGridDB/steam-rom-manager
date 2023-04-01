# EA Desktop Parser specific inputs

## EA Desktop 游戏目录
默认情况下，Steam ROM 管理器假定您的`EA Desktop`游戏已安装在``C:\Program Files\EA Games\`。 该字段允许您更改游戏安装的位置，例如``D:\Games\EA Games`。

## 通过 EA Desktop 启动
如果启用了SRM，它将添加一个快捷方式到`origin2://game/launch/?offerIds=${gameid}`而不仅仅是游戏的可执行文件。 这将确保游戏通过 EA 启动，并且可以访问在线服务。
