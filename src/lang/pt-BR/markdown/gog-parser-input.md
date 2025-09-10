#

## Sobrescrever caminho da Galáxia

##

What it sounds like, this toggle determines whether games launch via GOG Galaxy or directly. For some games launching from GOG Galaxy may fail, and the Steam overlay will most likely not work.

## Parse Linked Executables from GOG Galaxy

If enabled, SRM will pull in not only GOG games aquired from GOG Galaxy's store, but also those you have manually linked executables for in GOG Galaxy. This is desirable if those games are not being parsed into SRM elsewhere.

A caveat is that because GOG Galaxy does not store the names linked executables in its database, SRM will use the directory name of the executable on Windows (e.g. `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`) and the executable name on Mac (e.g. `/Applications/Symphonia.app` would be assigned the title `Symphonia`).

## Parse using Registry instead of Galaxy DB `[Windows only] [Recommend disabled]`
This option will parse the Windows Registry for installed GOG games instead of GOG Galaxy's SQL database, allowing the parser to work even if GOG Galaxy is not installed. If this is enabled, `Parse Linked Executables` will of have no effect, but `Launch via GOG Galaxy` will work as normal.