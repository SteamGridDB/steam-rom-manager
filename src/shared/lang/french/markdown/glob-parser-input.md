# Globes utilisateur

TC'est ici que vous créez votre glob pour extraire le titre du chemin de fichier. Veuillez lire tout ce qui suit [special glob characters](#special-glob-characters) si vous ne savez pas construire un globe.

## Comment ça marche?

En plus des caractères globulaires spéciaux, l'analyseur globulaire requiert que vous saisissiez `${title}`{.noWrap} variable. Parser localisera sa position à l'intérieur de votre fichier**glob**, par exemple:

|Position des globes utilisateur|
|---|---|
|`${title}/*/*.txt`|Premier niveau à partir de la gauche|
|`{*,*/*}/${title}.txt`|Premier niveau à partir de la droite|
|`**/${title}/*.txt`|Deuxième niveau à partir de la droite|

Après l'acquisition `${title}`{.noWrap} position, `${title}`{.noWrap} wmal être remplacé par un caractère de remplacement `*`.

## Limitations

L'extraction de position comporte certaines limitations -- glob est invalide si la position ne peut pas être extraite. La plupart du temps, vous serez averti de ce que vous ne pouvez pas faire, cependant, si vous trouvez une combinaison qui est permise, mais produit des titres incorrects, veuillez faire un problème à l'adresse suivante [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
