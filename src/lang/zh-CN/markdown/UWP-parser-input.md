# UWP 解析器的独特输入

## 游戏目录

UWP 应用程序应该说明它们是游戏还是应用程序，但这并不总是正确的。 为了解决这个问题，有用的方法是指定你安装游戏的位置，只扫描那些 UWP 应用程序。 默认为 `C:\XboxGames`。

Set it to `C:\Program Files\WindowsApps` to grab all UWP applications -- you'll have to remove unwanted ones by hand.

## 作为 UWP 启动或从 GameLaunchHelper.exe 启动

Gamepass 游戏可以通过两种方式启动，尽管 UWP 更受欢迎。
