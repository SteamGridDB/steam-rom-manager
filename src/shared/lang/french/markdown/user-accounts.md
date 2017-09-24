# Comptes utilisateurs (facultatif)

Peut être utilisé pour limiter la configuration à des comptes utilisateurs spécifiques. Pour définir les comptes utilisateurs, la syntaxe suivante doit être utilisée:
```
${...}
```
Tu**must** utilise le nom d'utilisateur que vous utilisez pour **log in** dans Steam:

![Account example](../../../images/user-account-example.png) {.fitImage .center}

Par exemple, voici comment vous spécifiez le compte pour "Banana" et "Apple":
```
${Banana}${Apple}
```

## Que fait "Sauter les comptes trouvés avec les répertoires de données manquants"?

Parfois le fichier de Steam qui contient des logins, peut contenir des utilisateurs qui n'ont pas de répertoire de données créé (peut-être effacé manuellement, etc.). Vous pouvez spécifier de sauter ces comptes en activant cette option.
