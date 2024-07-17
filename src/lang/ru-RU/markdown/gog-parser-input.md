# Особые входные данные анализатора GOG Galaxy

## Переопределение пути GOG Galaxy
By default Steam ROM Manager assumes your GOG Galaxy executable is located at `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe` on Windows and `/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy` on Mac. This field allows you to override that path if your GOG Galaxy executable is elsewhere.

Specifying the correct location of GOG Galaxy's executable is only necessary if you enable launch via GOG Galaxy (see below), as otherwise SRM has no need of the location of GOG Galaxy's executable.

## Запуск через GOG Galaxy `[Рекомендовать отключено]`

What it sounds like, this toggle determines whether games launch via GOG Galaxy or directly. For some games launching from GOG Galaxy may fail, and the Steam overlay will most likely not work.

##

Если эта опция включена, SRM будет добавлять не только игры GOG, приобретенные в магазине GOG Galaxy, но и те, для которых вы вручную связали исполняемые файлы в GOG Galaxy. Это желательно, если эти игры не разбираются на SRM в других местах.

A caveat is that because GOG Galaxy does not store the names linked executables in its database, SRM will use the directory name of the executable on Windows (e.g. `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`) and the executable name on Mac (e.g. `/Applications/Symphonia.app` would be assigned the title `Symphonia`).