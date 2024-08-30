# EA Desktop Parser specific inputs

## EA Games Directory Override

Standardmäßig geht der Steam ROM Manager davon aus, dass deine `EA Desktop` Spiele unter `C:\Program Files\EA Spiele installiert sind. Dieses Feld erlaubt es dir, den Speicherort zu ändern, unter dem deine Spiele installiert sind, z.B.`D:\Games\EA Games`.

## Launch Games Via EA Desktop

Wenn aktiviert, wird SRM anstatt der ausführbaren Datei eine Verknüpfung zu `origin2://game/launch/?offerIds=${gameid}` hinzufügen. Dies stellt sicher, dass das Spiel über EA gestartet wird und Zugang zu Online-Diensten hat.

`Dies ist erforderlich, um EA Play Spiele hinzuzufügen. EA Play Spiele werden nicht erkannt, wenn dies nicht eingeschaltet wird.`
