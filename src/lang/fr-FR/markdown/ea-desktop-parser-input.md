# EA Desktop Parser Specific Inputs

## EA Games Directory Override
Par défaut, Steam ROM Manager assume que vos jeux `EA Desktop` sont installés sur ``C:\Program Files\EA Games\`. Ce champ vous permet de remplacer ce chemin à l'endroit où vos jeux sont installés, par exemple``D:\Games\EA Games`.

## Launch Games Via EA Desktop
Si cette option est activée, SRM ajoutera un raccourci à `origin2://game/launch/?offerIds=${gameid}` au lieu de l'exécutable du jeu. Cela garantit le lancement du jeu via EA et donnera accès aux services en ligne.

`Ceci est nécessaire pour ajouter des jeux EA Play. Les jeux EA Play ne seront pas détectés si cette option n'est pas activée.`
