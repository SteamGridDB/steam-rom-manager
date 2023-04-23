# Comptes utilisateur (facultatif)

Peut être utilisé pour limiter la configuration à des comptes utilisateurs spécifiques. Afin de définir des comptes utilisateurs, la syntaxe suivante doit être utilisée:
```
${...}
```
Vous **devez** utiliser le nom d'utilisateur que vous utilisez pour vous **connecter** à Steam **si** [utiliser les noms de compte](#what-does-use-account-credentials-do) est activé:

![Exemple de compte](../../../assets/images/user-account-example.png) {.fitImage.center}

Par exemple, c'est ainsi que vous spécifiez le compte pour "Banana" et "Apple":

```
${Banana}${Apple}
```

You can also set accounts accounts by specifying their ids directly:

```
${56489124}${21987424}
```

The account id is the name of the account directory that appears in `/path/to/steam/userdata`.
