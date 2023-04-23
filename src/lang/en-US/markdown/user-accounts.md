# User accounts (Optional)

Can be used to limit configuration to specific user accounts. In order to set user accounts, the following syntax must be used:
```
${...}
```
You **must** use the username you use to **log in** into Steam **if** [use account credentials](#what-does-use-account-credentials-do) is enabled: 

![Account example](../../../assets/images/user-account-example.png) {.fitImage .center}

For example, this is how you specify account for "Banana" and "Apple":

```
${Banana}${Apple}
```

You can also set accounts accounts by specifying their ids directly: 

```
${56489124}${21987424}
```

The account id is the name of the account directory that appears in `/path/to/steam/userdata`.
