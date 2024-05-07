# Steam parser

This parser imports steam games into SRM so you can manage their artwork. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## Limitations
Unfortunately for the time being this parser only works for steam games **that are in at least one category**. The reason for this is that Steam only stores your full list of games locally if they are categorized. Sometimes, for unknown reasons, games will be stored locally regardless and the parser will work, but to be safe the easiest thing to do is just **create a Steam Category** that has all of your Steam games in it.

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

## What does "Skip found accounts with missing data directories" do?

Sometimes Steam's file that contains logins, may contain users that do not have data directory created (might have been manually deleted, etc.). You can specify to skip those accounts by enabling this option.

## What does "Use account credentials" do?

Tries to look for account credentials in Steam directory. In other words -- username. Username then can be used to filter accounts without actually having to know their ids.

### Warning!

If Steam has credential saving disabled, this option will prevent finding user accounts.
