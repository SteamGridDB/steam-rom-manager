# Entrées spécifiques à l'analyseur Glob

## Glob de l'utilisateur

C'est là que vous créez vos glob pour extraire les titres depuis les chemins de fichiers. S'il vous plait lisez tout des [ caractères spéciaux glob](#special-glob-characters) si vous ne comprenez pas comment construire un glob.

## Comment est-ce que cela fonctionne?

En plus des caractères spéciaux glob, l'analyseur glob requière que vous saisissiez la variable `${title}`{.noWrap}. L'analyseur va localiser sa position dans votre **glob**, par exemple:

| Glob de l'utilisateur  | Position                        |
| ---------------------- | ------------------------------- |
| `${title}/*/*.txt`     | Premier niveau depuis la gauche |
| `{*,*/*}/${title}.txt` | Premier niveau depuis la droite |
| `**/${title}/*.txt`    | Second niveau depuis la droite  |

Après avoir aquis la position de `${title}`{.noWrap}, `${title}`{.noWrap} sera remplacé avec un caractère générique `*`.

## Limitations

La position d'extraction vient avec quelques limitations - glob est invalide si la position ne peut pas être extraite. Le plus souvent vous serez avertis sur ce que vous ne pouvez pas faire, cependant, si vous trouvez une combinaison qui est autorisée, mais produit un titre incorrect créez s'il vous plait une issue sur [GitHub](https://github.com/FrogTheFrog/steam-rom-manager/issues).
