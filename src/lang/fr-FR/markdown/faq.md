# Foire aux questions

Lisez ceci si vous rencontrez encore des problèmes de configuration. Pour la plupart des exemples, les éléments suivants seront utilisés, sauf indication contraire:

|                         |                                            |
| ----------------------- | ------------------------------------------ |
| **Répertoire des ROMs** | `C:/ROMs`                                  |
| **Fichier 1**           | `C:/ROMs/Kingdom Hearts/jeu.iso`           |
| **Fichier 2**           | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **Fichier 3**           | `C:/ROMs/dir1/dir2/dir3/Metroid [PAL].nes` |
| **Fichier 4**           | `C:/ROMs/dir1/dir2/dir3/sauvegarde.sav`    |
| **Fichier 5**           | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **Fichier 6**           | `C:/ROMs/dir1/dir2/sauvegarde.sav`         |

## Alors, comment configurer un global?

D'abord, analysons le **Fichier 1**. Son chemin complet est `C:/ROMs/Kingdom Hearts/jeu.iso`. Puisque notre **Répertoire ROMs** est `C:/ROMs`, nous pouvons simplement le supprimer du chemin de **Fichier 1**.

Nous nous retrouvons avec `Kingdom Hearts/jeu.iso`. Il est évident pour nous que `Kingdom Hearts` est le titre, Cependant, l'analyseur n'est pas très malin -- vous devez spécifier la portion de chemin qui contient le titre en remplaçant `Kingdom Hearts` par `${title}`.

Encore une fois, nous nous retrouvons avec `${title}/jeu.iso`, mais nous voulons aussi le **Fichier 2**, car c'est pour le même émulateur. Le **Fichier 1** est `jeu.iso` et **Fichier 2** est `rom.iso`. Et maintenant?

Les métacaractères. Ils nous permettent de nous débarrasser des informations qui n'ont pas vraiment d'importance. Dans ce cas, nous ne nous soucions pas si c'est `jeu` ou `rom`, nous voulons que les deux soient mis en correspondance. C'est pourquoi nous les remplaçons par `*`. Voici le global final pour **Fichier 1** et **Fichier 2**:

```
${title}/*.iso
```

En utilisant une logique similaire, nous pouvons produire un global pour **Fichier 3**:

```
*/*/*/${title}.nes
```

## How to deal with multi-leveled directories?

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while **File5** has `2`. Et maintenant?

Now we can use a globstar and that's it!

```
**/${title}.*
```

Est-ce vraiment aussi simple? **NO!** Globstar will have some impact in parser's performance if there are many subdirectories with thousands of files each. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere.

A recommended solution is to use braced sets. They can make multiple globs out of `1` glob. If we write a glob like this:

```
{*,*/*}/*/${title}.*
```

we will get `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

These `2` globs both satisfy our files, **File3** and **File5**.

## Comment limiter les extensions de fichier?

Disons que nous utilisons le global de l'exemple précédent:

```
{*,*/*}/*/${title}.*
```

We will end up with 4 files: **File3**, **File4**, **File5** and **File6**. Now, we don't need **File4** and **File6**. Normally we could set glob to:

```
{*,*/*}/*/${title}.nes
```

but then we will end up only with **File3**, because `nes` is not equal to `NES` -- parser is case sensitive. There are two ways to solve this problem using extended glob matcher.

### Exclure l'extension `sav`

Extended glob matcher `!(...)` allows us to exclude stuff. Simply write glob like this:

```
{*,*/*}/*/${title}.!(sav)
```

et les fichiers avec l'extension `sav` seront exclus.

### Rechercher plusieurs extensions

Extended glob matcher `@(...)` allows us to match multiple things. Simply write glob like this:

```
{*,*/*}/*/${title}.@(nes|NES)
```

and only files with `nes` and `NES` will be matched. If you're feeling fancy or if you have files with extensions `nes`, `NES`, `neS`, `nEs`, `Nes` and etc., you need a glob that uses character range:

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

Now parser can match any combination and is effectively case-insensitive. Technically, the following glob will work too, but the one above looks better.

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## Résolution des problèmes

- Veuillez vous assurer que Steam est belle et bien fermé avant d'enregistrer votre liste d'applications.

- Un problème courant que Steam ROM Manager rencontre est la présence d'anciens répertoires Steam provenant de personnes qui se sont connectées à Steam sur votre ordinateur avant la mise à jour de la nouvelle bibliothèque. Cela peut faire échouer Steam ROM Manager de manière imprévisible, car il essaie d'accéder aux répertoires dont la structure a changé. Pour contourner cela, utilisez le champ [Comptes utilisateur](#user-accounts) pour spécifier les comptes avec lesquels vous souhaitez réellement utiliser Steam ROM Manager.

## Le Discord

Pour plus d'aide, veuillez consulter notre [Discord](https://discord.gg/bnSVJrz).
