#

## Legendary Path Override

By default Steam ROM Manager uses `(Get-Command legendary).Path` on Windows and `which legendary` on Linux and Mac to determine the location of your Legendary executable. This field allows you to override that path.

Specifying the correct location of the Legendary executable is only necessary if you enable launch via Legendary (see below), as otherwise SRM has no need of the location of Legendary's executable.

## Legendary `installed.json` 路径覆盖

大多数用户不应该使用这个，因为他们使用标准的 `Legendary` 安装，在那里已安装游戏清单将位于`~/.config/legendary/installed.json`。

然而，如果由于某些原因您安装的游戏清单位于非典型位置，则可以在此处指定正确的清单路径。

## Launch via Legendary `[Recommend enabled]`

What it sounds like, this toggle determines whether games launch via Legendary or directly. Launching via Legendary provides access to Epic's online services.
