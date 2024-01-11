# 用户账户（可选）

该字段用于限制 SRM 对特定用户账户的影响，并采用以下形式的值

`${...}`

This will limit SRM's effects to accounts `XXX` and `YYY` (you may specify as many accounts as you like). Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: Here `XXX` and `YYY` stand in for either: 这里`XXX` 和`YYY`代表：

* The account id is the name of the account directory that appears in `/path/to/steam/userdata`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. For example, you would specify the account directory `userdata/56489124` like `${56489124}`. 例如，您可以指定账户目录 `userdata/56489124`，例如 `${56489124}`。

* A `Steam Username` (the username you use to actually log in to Steam). A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`. A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`. A `Steam Username` (the username you use to actually log in to Steam). For example you would specify the users `Banana` and `Apple` like `${Banana}${Apple}`.

您可以混合搭配：`${56489124}${Apple}` 就可以。

您还可以通过 `${${accountsglobal}}` 使用设置中的 `Accounts Global` 环境变量来设置此字段。

## 警告

**如果** 启用了 [使用帐户凭据](#what-does-use-account-credentials-do)，则 **必须** 使用您在 Steam **登录** 时使用的用户名： If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Account` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM. If you would like to use `Steam Usernames` here, go to `Steam > Settings > Settings` and disable `Don't save account credentials on this computer`, then restart both Steam and SRM.
