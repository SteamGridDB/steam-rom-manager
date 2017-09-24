# Foire aux questions

Lisez ceci si vous rencontrez encore des problèmes de configuration. Pour la plupart des exemples, sauf indication contraire, les exemples suivants seront utilisés:

|||
|---|---|
|**ROMs directory**|`C:/ROMs`|
|**File1**|`C:/ROMs/Kingdom Hearts/game.iso`|
|**File2**|`C:/ROMs/Kingdom Hearts II/rom.iso`|
|**File3**|`C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes`|
|**File4**|`C:/ROMs/dir1/dir2/dir3/save.sav`|
|**File5**|`C:/ROMs/dir1/dir2/Dragon Quest IV.NES`|
|**File6**|`C:/ROMs/dir1/dir2/save.sav`|

## Comment dois-je configurer le globe de l'utilisateur?

Analysons d'abord **File1**. Son chemin complet est `C:/ROMs/Kingdom Hearts/game.iso`. Puisque notre **ROMs directory** est `C:/ROMs`, on peut juste l'enlever **File1** chemin.

Nous finissons avec `Kingdom Hearts/game.iso`. Il est évident pour nous que `Kingdom Hearts` est le titre, cependant l'analyseur est plus bête que vous -- vous devez spécifier le chemin d'accès qui contient le titre en remplaçant `Kingdom Hearts` avec `${title}`.

Encore une fois, nous finissons avec `${title}/game.iso`, mais nous voulons aussi **File2**, parce que c'est pour le même émulateur. **File1** est `game.iso` et **File2** est `rom.iso`. Et maintenant?

Tu te souviens des cartes de remplacement? Ils nous permettent de nous défaire d'informations qui n'ont pas vraiment d'importance. Dans ce cas, on s'en fout si c'est `game` ou `rom`, nous voulons que les deux soient assortis. C'est pourquoi nous les remplaçons par `*`. C'est le dernier globe pour les deux **File1** et **File2**:

```
${title}/*.iso
```

En utilisant une logique similaire, nous pouvons produire des globes pour **File3**:

```
*/*/*/${title}.nes
```

## Comment gérer les répertoires à plusieurs niveaux?

Cette fois-ci, nous voulons **File3** et **File5** (les deux ont des extensions différentes, lisez la section suivante sur ce qu'il faut faire pour l'instant nous allons utiliser `*` pour ignorer l'extension). Notez que **File3** a des sous-répertoires `3` tandis que **File5** a des sous-répertoires `2`. Et maintenant?

Maintenant, on peut utiliser une globstar et c'est tout!
```
**/${title}.*
```
C'est aussi simple que ça? **NO**!Globstar aura un certain impact sur les performances de l'analyseur s'il y a plusieurs sous-répertoires contenant des milliers de fichiers chacun. Globstar s'assurera que l'analyseur vérifie tous les fichiers qu'il peut trouver. L'utilisateur a déjà signalé que l'analyse prenait environ 10 minutes quand il utilisait des globstars partout.
A recommended solution is to use braced sets. They can make multiple globs out of `1` glob. If we write a glob like this:

```
{*,*/*}/*/${title}.*
```

nous obtiendrons `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

These `2` globs both satisfy our files, **File3** and **File5**.

## Comment limiter les extensions de fichiers?

Supposons que nous utilisions le globe globulaire de l'exemple précédent:

```
{*,*/*}/*/${title}.*
```

Nous allons finir avec 4 fichiers: **File3**, **File4**, **File5** et **File6**. Maintenant, nous n'avons pas besoin de **File4** et **File6**. Normalement, on pourrait mettre le globe à:

```
{*,*/*}/*/${title}.nes
```

mais alors nous finirons seulement avec **File3**, parce que `nes` n'est pas égal à `NES` -- l'analyseur est sensible à la casse. Il y a deux façons de résoudre ce problème en utilisant le Global Matcher étendu.

### Exclure `sav` extension

Extended glob matcher `! (...)` nous permet d'exclure des choses. Il suffit d'écrire un globe comme ça:

```
{*,*/*}/*/${title}.!(sav)
```

et des fichiers avec `sav` seront exclue.

Vérifier les extensions multiples

Correspondant globulaire étendu `@(...)` nous permet de faire correspondre plusieurs choses. Il suffit d'écrire un globe comme ça:

```
{*,*/*}/*/${title}.@(nes|NES)
```

et uniquement les fichiers avec `nes` et `NES` seront appariés. Si vous êtes fantaisiste ou si vous avez des fichiers avec les extensions `nes`, `NES`, `neS`, `nEs`, `Nes` et etc., vous avez besoin d'un globe qui utilise la gamme de caractères:

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

Maintenant l'analyseur peut correspondre à n'importe quelle combinaison et est effectivement insensible à la casse. Techniquement, le globe suivant fonctionnera aussi, mais celui ci-dessus semble mieux.

```
{*,*/*}/*/${title}.[nN][eE][sS]
```
