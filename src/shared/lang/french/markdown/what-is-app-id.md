# Quel est l'ID APP de Steam?

Steam utilise APP ID pour identifier les jeux. Pour les jeux non Steam, ils sont générés en utilisant:

- Exécutable;
- Titre final de l'application.

Si vous utilisez `RetroArch` ou des émulateurs similaires pour ajouter le même jeu, mais sur des consoles différentes, vous rencontrerez un problème où seulement **one** le titre est ajouté et d'autres disparaissent. Ceci est dû aux identificateurs APP en double.

## Ajout de titres identiques à partir de différentes consoles

SL'ID APP de l'équipe ne doit pas être identique. Ceci peut être réalisé en changeant **Title modifier** valeur ou activant **Append arguments to executable**. La deuxième option ajoute une troisième variable à APP ID:

- Exécutable;
- Titre final de l'application;
- Arguments de la ligne de commande.

La plupart du temps, la ligne de commande contiendra un chemin d'accès unique qui devrait permettre de générer des ID APP uniques.
