# Benutzerkonten (Optional)

This field is used to limit SRM's effects to specific user accounts, and takes values of the form:

`${...}`

This will limit SRM's effects to accounts `XXX` and `YYY` (you may specify as many accounts as you like). Here `XXX` and `YYY` stand in for either:

* The account id is the name of the account directory that appears in `/path/to/steam/userdata`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`.

* A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`.

You can mix and match: `${56489124}${Apple}` is fine.

You can also set this field using the `Accounts Global` environment variable found in settings via `${${accountsglobal}}`.

## Warning

Es **müssen** die Benutzernamen verwendet werden, die zum **Einloggen** in Steam verwendet werden, **falls** [Anmeldeinformationen verwenden](#what-does-use-account-credentials-do) aktiviert wurde: If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
