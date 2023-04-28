# 用户账户（可选）

This field is used to limit SRM's effects to specific user accounts, and takes values of the form:

`${...}`

This will limit SRM's effects to accounts `XXX` and `YYY` (you may specify as many accounts as you like). Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either:

* The account id is the name of the account directory that appears in `/path/to/steam/userdata`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`.

* A `Steam Username` (the username you use to actually log in to Steam). A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`. A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`. A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`.

You can also mix and match: `${56489124}${Apple}` is fine.

## Warning

**如果** 启用了 [使用帐户凭据](#what-does-use-account-credentials-do)，则 **必须** 使用您在 Steam **登录** 时使用的用户名： If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. **如果** 启用了 [使用帐户凭据](#what-does-use-account-credentials-do)，则 **必须** 使用您在 Steam **登录** 时使用的用户名： If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
