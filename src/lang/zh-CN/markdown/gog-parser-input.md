#

## Galaxy 路径覆盖

By default Steam ROM Manager assumes your GOG Galaxy executable is located at `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe` on Windows and `/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy` on Mac. This field allows you to override that path if your GOG Galaxy executable is elsewhere.

Specifying the correct location of GOG Galaxy's executable is only necessary if you enable launch via GOG Galaxy (see below), as otherwise SRM has no need of the location of GOG Galaxy's executable.

## Launch via GOG Galaxy `[Recommend disabled]`

What it sounds like, this toggle determines whether games launch via GOG Galaxy or directly. For some games launching from GOG Galaxy may fail, and the Steam overlay will most likely not work.

##

如果在其他地方不将这些游戏解析成SRM，这样做是可取的。

需要注意的是，由于GOGGalaxy不在其数据库中存储名称链接的可执行文件，因此SRM将使用Windows上可执行文件的目录名称(例如 `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`)将被分配标题`Hoa`)，而Mac上的可执行文件名称(例如 `/Applications/Symphonia.app` 将被分配标题 <0>Symphonia</0>。

## Parse using Registry instead of Galaxy DB `[Windows only] [Recommend disabled]`
This option will parse the Windows Registry for installed GOG games instead of GOG Galaxy's SQL database, allowing the parser to work even if GOG Galaxy is not installed. If this is enabled, `Parse Linked Executables` will of have no effect, but `Launch via GOG Galaxy` will work as normal.