# GOG Galaxy Parser Specific Inputs

## Galaxy Pfad überschreiben
By default Steam ROM Manager assumes your GOG Galaxy executable is located at `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe` on Windows and `/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy` on Mac. This field allows you to override that path if your GOG Galaxy executable is elsewhere.

Specifying the correct location of GOG Galaxy's executable is only necessary if you enable launch via GOG Galaxy (see below), as otherwise SRM has no need of the location of GOG Galaxy's executable.

## Mit GOG Galaxy starten `[Nicht empfohlen]`

What it sounds like, this toggle determines whether games launch via GOG Galaxy or directly. For some games launching from GOG Galaxy may fail, and the Steam overlay will most likely not work.

## Parse Linked Executables from GOG Galaxy

If enabled, SRM will pull in not only GOG games aquired from GOG Galaxy's store, but also those you have manually linked executables for in GOG Galaxy. This is desirable if those games are not being parsed into SRM elsewhere.

A caveat is that because GOG Galaxy does not store the names linked executables in its database, SRM will use the directory name of the executable on Windows (e.g. `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`) and the executable name on Mac (e.g. `/Applications/Symphonia.app` would be assigned the title `Symphonia`).