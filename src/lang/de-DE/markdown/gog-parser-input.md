# GOG Galaxy Parser Specific Inputs

## Galaxy Pfad überschreiben

By default Steam ROM Manager assumes your GOG Galaxy executable is located at `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe` on Windows and `/Applications/GOG Galaxy.app/Contents/MacOS/GOG Galaxy` on Mac. This field allows you to override that path if your GOG Galaxy executable is elsewhere.

Specifying the correct location of GOG Galaxy's executable is only necessary if you enable launch via GOG Galaxy (see below), as otherwise SRM has no need of the location of GOG Galaxy's executable.

## Über GOG Galaxy starten `[Deaktiviert empfohlen]`

Dieser Schalter gibt an, ob Spiele über GOG Galaxy oder direkt gestartet werden sollen. Bei manchen Spielen funktioniert das Starten über GOG Galaxy nicht und das Steam-Overlay wird wahrscheinlich nicht funktionieren.

## Verlinkte Programme von GOG Galaxy analysieren

Falls aktiv wird SRM nicht nur gekaufte GOG-Spiele übernehmen, sondern auch manuell verknüpfte Programme in GOG Galaxy. Dies wird empfohlen, wenn diese Spiele nicht anderweitig in SRM hinzugefügt werden.

A caveat is that because GOG Galaxy does not store the names linked executables in its database, SRM will use the directory name of the executable on Windows (e.g. `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`) and the executable name on Mac (e.g. `/Applications/Symphonia.app` would be assigned the title `Symphonia`).

## Über Registry anstatt Galaxy DB analysieren `[nur Windows] [Deaktiviert empfohlen]`
Diese Option wird die Windows Registry nach installierten GOG-Spielen analysieren, anstatt der SQL-Datenbank von GOG Galaxy, sodass der Parser auch dann funktioniert, wenn GOG Galaxy nicht installiert ist. Falls aktiv wird `Verlinkte Programme analysieren` nicht funktionieren, dafür wird aber `Über GOG Galaxy` normal funktionieren.