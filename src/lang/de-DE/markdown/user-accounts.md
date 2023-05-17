# Benutzerkonten (Optional)

Mit diesem Feld kannst du SRM auf bestimmte Benutzernkonten einschränken. Möglich sind Werte in Form von:

`${XXX}${YYY}`

Dies schränkt SRM auf die Konten `XXX` und `YYY` ein. Die Anzahl der Konten ist uneingeschränkt. `XXX` und `YYY` stehen hier für:

* Eine `Account ID` (Die Nummer deines Steam Accounts, zu sehen in deinem Verzeichnis `/Pfad/zu/Steam/userdata/`). So kannst du zum Beispiel `userdata/56489124` als `${56489124}` angeben.

* Ein `Steam Benutzername` (Der Name mit dem du dich in Steam einloggst). So kannst du zum Beispiel den Benutzer `Foo` und `Bar` als `${Foo}${Bar}`.

You can mix and match: `${56489124}${Apple}` is fine.

Du kannst dieses Feld auch mit der `Accounts Global` Umgebungsvariable aus den Einstellungen mit `${${accountsglobal}}` setzen.

## Warning

Es **müssen** die Benutzernamen verwendet werden, die zum **Einloggen** in Steam verwendet werden, **falls** [Anmeldeinformationen verwenden](#what-does-use-account-credentials-do) aktiviert wurde: If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
