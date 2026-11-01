# Legendary 解析器特定输入

## Legendary路径覆盖

默认情况下，SRM使用在 Windows 命令行上执行命令 `(Get-Command legendary).Path`，在 Linux 和 Mac 上用`which legendary`为 来确定Legendary可执行文件的位置。 此字段允许您覆盖该路径。

指定Legendary可执行文件的正确位置，只有当您通过Legendary启用启动时才是必要的(见下文)， 否则，SRM就不需要Legendary可执行文件的位置。

## Legendary `installed.json` 路径覆盖

大多数用户不应该使用这个，因为他们使用标准的 `Legendary` 安装，在那里已安装游戏清单将位于`~/.config/legendary/installed.json`。

然而，如果由于某些原因您安装的游戏清单位于非典型位置，则可以在此处指定正确的清单路径。

## 通过 Legendary启动`[建议禁用]`

这个切换决定了游戏是通过Legendary还是直接启动。 透过Legendary启动可以访问Epic的在线服务。
