# Glob-regex de l'utilisateur

TC'est ici que vous créez votre glob pour extraire le titre du chemin de fichier. Veuillez lire tout ce qui suit [special glob characters](#special-glob-characters) si vous ne savez pas construire un globe.

## Comment ça marche?

En plus des caractères globaux spéciaux, l'analyseur globulaire requiert que vous saisissiez la variable `${//... /}`{.noWrap} variable. L'analyseur va localiser sa position à l'intérieur de votre globe, par exemple:

|Position des globes utilisateur|
|---|---|
|`${/.+/}/*/*.txt`|Premier niveau à partir de la gauche|
|`{*,*/*}/${/.+/}.txt`|Premier niveau à partir de la droite|
|`**/${/.+/}/*.txt`|Deuxième niveau à partir de la droite|

Après l'acquisition `${/.../}`{.noWrap} position, `${/.../}`{.noWrap} sera remplacé par un caractère de remplacement `*`.

## Post-traitement Regex

Après l'extraction du titre, le titre sera traité par une expression régulière. Il y a 3 façons d'écrire une expression régulière.

### Expression régulière sans capture: `${/.+/}`{.noWrap}

C'est pratiquement identique à l'analyseur "Glob", chaque titre extrait sera utilisé.

### Expression régulière avec des crochets de capture: `${/(.+)/}`{.noWrap}

Les correspondances multiples et les groupes de capture sont autorisés. Par exemple, nous avons ici 2 groupes de correspondances avec plusieurs groupes de capture:
```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```
Le premier groupe de matchs (de gauche à droite) avec toutes les bonnes captures sera utilisé. De plus, tous les groupes de capture seront **joined**.

### Expression régulière avec des crochets de capture et texte de remplacement: `${/(.+)/|...}`{.noWrap}

Semblable à [regular expression with capture brackets](#regular-expression-with-capture-brackets) à part la façon dont il gère les groupes capturés. Le texte de remplacement peut être utilisé pour se déplacer dans les groupes capturés. Par exemple:
```
${/(.*?)\s*\[USA\]\s*(.+)/|Second capture group: "$2" precedes the first one, which is "$1" }
```
Si notre premier groupe de capture est `Legend of Zelda` et le deuxième est `SUPER EDITION`, alors nous obtiendrons le titre suivant (pas très utile):

`Deuxième groupe de capture: "SUPER EDITION" précède le premier, qui est "Legend of Zelda"`

Le texte non modifié restera par défaut, donc si vous voyez des caractères en fin de ligne, assurez-vous d'ajouter `.*` à la fin ou `.*?` au début de l'expression régulière.

### Blocs pris en charge

Les blocs autorisés sont `i` et `u`.

## Limites

L'extraction de position comporte certaines limitations -- glob est invalide si la position ne peut pas être extraite. La plupart du temps, vous serez averti de ce que vous ne pouvez pas faire, cependant, si vous trouvez une combinaison qui est permise, mais produit des titres incorrects, veuillez faire un problème à l'adresse suivante [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
