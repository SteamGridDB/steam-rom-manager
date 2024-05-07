# Non-SRM Shortcut Parser

This parser imports non SRM steam shortcuts into SRM so their artowrk can be managed. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## User accounts (required)

Used to limit configuration to specific user accounts. In order to set user accounts, the following syntax must be used:
```
${...}
```
You **must** use the username you use to **log in** into Steam **if** [use account credentials](#what-does-use-account-credentials-do) is enabled: 

![Account example](../../../assets/images/user-account-example.png) {.fitImage .center}

For example, this is how you specify account for "Banana" and "Apple":

```
${Banana}${Apple}
```

You can also limit accounts by specifying their ids directly. For example:

```
${56489124}${21987424}
```
Would limit the search to `steam/userdata/56489124` and `steam/userdata/21987424`.
