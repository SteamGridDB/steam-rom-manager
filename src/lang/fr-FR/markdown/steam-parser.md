# Analyseur Steam

This parser imports steam games into SRM so you can manage their artwork. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## Limitations
Malheureusement pour le moment, cet analyseur ne fonctionne que pour les jeux Steam **qui sont dans au moins une catégorie**. La raison en est que Steam stocke uniquement votre liste complète de jeux localement s'ils sont catégorisés. Parfois, pour des raisons inconnues, les jeux seront stockés localement et l'analyseur fonctionnera, mais pour en être sûr, la meilleure chose à faire est juste **de créer une catégorie Steam** qui a tous vos jeux Steam dedans.

## User accounts (required)

Used to limit configuration to specific user accounts. Afin de définir des comptes utilisateurs, la syntaxe suivante doit être utilisée:
```
${...}
```
Vous **devez** utiliser le nom d'utilisateur que vous utilisez pour vous **connecter** à Steam **si** [utiliser les noms de compte](#what-does-use-account-credentials-do) est activé:

![Exemple de compte](../../../assets/images/user-account-example.png) {.fitImage.center}

Par exemple, c'est ainsi que vous spécifiez le compte pour "Banana" et "Apple":

```
${Banana}${Apple}
```

You can also limit accounts by specifying their ids directly. For example:

```
${56489124}${21987424}
```
Would limit the search to `steam/userdata/56489124` and `steam/userdata/21987424`.

## Que fait "Ignorer les comptes trouvés avec des données manquantes"?

Parfois, le fichier Steam qui contient les identifiants, peut contenir des utilisateurs qui n'ont pas de répertoire de données créé (peut avoir été supprimé manuellement, etc.). Vous pouvez spécifier d'ignorer ces comptes en activant cette option.

## Que fait "Utiliser les noms de compte"?

Tente de rechercher les noms de compte dans le répertoire Steam.   Les noms de compte peuvent alors être utilisé pour filtrer les comptes sans avoir à connaître leurs identifiants.

### Attention!

Si la sauvegarde des informations d'identification est désactivée, cette option empêchera la recherche de comptes d'utilisateur.
