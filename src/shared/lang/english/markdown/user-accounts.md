# User accounts (Optional)

Can be used to limit configuration to specific user accounts. In order to set user accounts, the following syntax must be used:
```
${...}
```
You **must** use the username you use to **log in** into Steam: 

![Account example](../../../images/user-account-example.png) {.fitImage .center}

For example, this is how you specify account for "Banana" and "Apple":
```
${Banana}${Apple}
```

## What does "Skip found accounts with missing data directories" do?

Sometimes Steam's file that contains logins, may contain users that do not have data directory created (might have been manually deleted, etc.). You can specify to skip those accounts by enabling this option.