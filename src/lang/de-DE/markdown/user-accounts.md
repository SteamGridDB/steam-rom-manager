# Benutzerkonten (Optional)

Mit diesem Feld kannst du SRM auf bestimmte Benutzernkonten einschränken. Möglich sind Werte in Form von:

`${XXX}${YYY}`

Dies schränkt SRM auf die Konten `XXX` und `YYY` ein. Die Anzahl der Konten ist uneingeschränkt. `XXX` und `YYY` stehen hier für:

* Eine `Account ID` (Die Nummer deines Steam Accounts, zu sehen in deinem Verzeichnis `/Pfad/zu/Steam/userdata/`). So kannst du zum Beispiel `userdata/56489124` als `${56489124}` angeben.

* Ein `Steam Benutzername` (Der Name mit dem du dich in Steam einloggst). So kannst du zum Beispiel den Benutzer `Foo` und `Bar` als `${Foo}${Bar}`.

Kombinieren ist ebenfalls möglich: `${56489124}${Apple}`.

Du kannst dieses Feld auch mit der `Accounts Global` Umgebungsvariable aus den Einstellungen mit `${${accountsglobal}}` setzen.

## Achtung

Wenn du `Anmeldedaten auf diesem Computer nicht speichern` in Steam eingestellt hast, kann SRM deinen `Steam Benutzernamen` nicht auslesen und du kannst **nur** ` Account IDs` benutzen. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Settings` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
