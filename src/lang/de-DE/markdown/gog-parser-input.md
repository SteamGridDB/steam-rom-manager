# GOG Galaxy Parser Specific Inputs

## Galaxy Pfad überschreiben
Steam ROM Manager geht davon aus, dass dein Galaxy Client sich in `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe` befindet. Mit diesem Feld kannst du einen anderen Pfad angeben, unter dem do GOG Galaxy installiert hast.

Dieses Feld ist nur notwendig, wenn du Spiele mit GOG Galaxy (siehe unten) startest. SRM hat sonst keine Verwendung für den Pfad des Galaxy Client.

## Mit GOG Galaxy starten `[Nicht empfohlen]`

Hiermit stellst du ein, ob du Spiele über GOG Galaxy oder direkt starten willst. Für manche Spiele kann das starten mit GOG Galaxy fehlschlagen und das Steam Overlay wird daraufhin wahrscheinlich nicht funktionieren.

## Parse Linked Executables from GOG Galaxy

If enabled, SRM will pull in not only GOG games aquired from GOG Galaxy's store, but also those you have manually linked executables for in GOG Galaxy. This is desirable if those games are not being parsed into SRM elsewhere. A caveat is that because GOG Galaxy does not store the names of such games, SRM will use the directory name of the executable: `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`.