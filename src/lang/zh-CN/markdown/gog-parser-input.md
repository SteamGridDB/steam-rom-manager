#

## Galaxy 路径覆盖

默认情况下，Steam ROM 管理器假定您的 GOG Galaxy 可执行文件位于 `C:\Program Files (x86)\GOG GalaxyClient.exe` 在Windows系统中， `/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy` 在Mac系统中。 如果你的 GOG Galaxy 安装在其他位置，这个字段允许你覆盖那个路径。

指定GOG 银河系统可执行文件的正确位置，只有在您通过GOG Galaxy启用时才是必要的(见下文)， 否则，SRM就不需要GOG Galaxy的可执行性位置了。

## 通过 GOG Galaxy 启动`[推荐禁用]`

听起来有什么意思，这个切换决定了游戏是通过 GOG Galaxy 启动还是直接启动。 请注意，对于某些游戏，从 GOG Galaxy 启动可能会失败，并且 Steam 覆盖层很可能无法正常工作。

##

如果在其他地方不将这些游戏解析成SRM，这样做是可取的。

需要注意的是，由于GOGGalaxy不在其数据库中存储名称链接的可执行文件，因此SRM将使用Windows上可执行文件的目录名称(例如 `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`)将被分配标题`Hoa`)，而Mac上的可执行文件名称(例如 `/Applications/Symphonia.app` 将被分配标题 <0>Symphonia</0>。

## 使用注册表而不是Galaxy DB `[仅Windows] [建议禁用]`
此选项将解析 Windows 注册表用于已安装的 GOG 游戏而不是 GOG Galaxy 的 SQL 数据库。 即使GOG Galaxy未安装，也允许解析器正常工作。 如果启用此功能， `解析链接可执行文件` 将无效，但 `通过 GOG Galaxy` 启动将正常工作。