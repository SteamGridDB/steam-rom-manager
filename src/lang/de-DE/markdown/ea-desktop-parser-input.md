# EA Desktop Parser specific inputs

## EA Desktop Games-Verzeichnis
Standardmäßig geht der Steam ROM Manager davon aus, dass deine `EA Desktop` Spiele unter `C:\Program Files\EA Spiele installiert sind. Dieses Feld erlaubt es dir, den Speicherort zu ändern, unter dem deine Spiele installiert sind, z.B.`D:\Games\EA Games`.

## Starte über EA Desktop
Wenn aktiviert, wird SRM anstatt der ausführbaren Datei eine Verknüpfung zu `origin2://game/launch/?offerIds=${gameid}` hinzufügen. Dies stellt sicher, dass das Spiel über EA gestartet wird und Zugang zu Online-Diensten hat.

`This is required to add EA Play games. EA Play games will not be detected if this is not toggled on.`
