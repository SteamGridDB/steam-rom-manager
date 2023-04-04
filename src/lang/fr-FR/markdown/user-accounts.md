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

Si [utiliser les noms de compte](#what-does-use-account-credentials-do) est désactivés, vous pouvez toujours limiter les comptes en spécifiant leurs identifiants directement:

```
${56489124}${21987424}
```

## Que fait "Ignorer les comptes trouvés avec des données manquantes"?

Parfois, le fichier Steam qui contient les identifiants, peut contenir des utilisateurs qui n'ont pas de répertoire de données créé (peut avoir été supprimé manuellement, etc.). Vous pouvez spécifier d'ignorer ces comptes en activant cette option.

## Que fait "Utiliser les noms de compte"?

Tente de rechercher les noms de compte dans le répertoire Steam.   Les noms de compte peuvent alors être utilisé pour filtrer les comptes sans avoir à connaître leurs identifiants.

### Attention!

Si dans Steam la sauvegarde des informations d'identification est désactivée, cette option empêchera la recherche de comptes d'utilisateur.
