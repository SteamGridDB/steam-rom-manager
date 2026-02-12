# Qu'est-ce qu'une APP ID Steam ?

Steam une APP ID pour identifier les jeux. Pour les jeux non-Steam ils sont générés en utilisant:

- Exécutable;
- Titre final du jeu.

Si vous utilisez `RetroArch` ou un émulateur similaire pour ajouter le même jeu, mais sur différentes consoles, vous rencontrerez le problème où seulement **un** des jeux sera ajouté. Cela est dû à des APP ID identiques.

## Ajouter des jeux identiques de différentes consoles

Les APP ID Steam ne doivent pas être identiques. Cela peut être fait en changeant **Title modifier** value ou en activant **ajouter des arguments à l'exécutable**. La deuxième option ajoute une troisième variable à APP ID:

- Exécutable;
- Titre final de l'app;
- Argument de la ligne de commande.

Le plus souvent la ligne de commande contiendra un unique chemin du jeu qui devrait autoriser la génération d'un unique APP ID.
