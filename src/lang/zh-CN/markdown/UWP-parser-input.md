# UWP Parser Specific Inputs

## 游戏目录

UWP 应用程序应该说明它们是游戏还是应用程序，但这并不总是正确的。 为了解决这个问题，有用的方法是指定你安装游戏的位置，只扫描那些 UWP 应用程序。 默认为 `C:\XboxGames`。

将其设置为 `C:\Program Files\WindowsApps` 以抓取所有UWP应用程序 -- 您将不得不手动删除不需要的应用程序。

## 作为 UWP 启动或从 GameLaunchHelper.exe 启动

Game Pass 游戏可以通过两种方式启动，尽管 UWP 更受欢迎。
