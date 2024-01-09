# User accounts (Optional)

This field is used to limit SRM's effects to specific user accounts, and takes values of the form:

```${XXX}${YYY}```

This will limit SRM's effects to accounts `XXX` and `YYY` (you may specify as many accounts as you like). Here `XXX` and `YYY` stand in for either: 

* An `Account ID` (the number that appears as the directory name of your account directory in `/path/to/steam/userdata/`). For example, you would specify the account directory `userdata/56489124` like `${56489124}`.

* A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`.

You can mix and match: `${56489124}${Apple}` is fine.

You can also set this field using the `Accounts Global` environment variable found in settings via `${${accountsglobal}}`.

## Warning

If you have `Don't save account credentials on this computer` set in Steam, then there is no way for SRM to know your `Steam Username` and **you must only use** `Account IDs`. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Settings` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
