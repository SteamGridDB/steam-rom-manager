# Qu'est-ce qu'une APP ID Steam ?

Steam une APP ID pour identifier les jeux. Pour les jeux non-Steam ils sont générés en utilisant:

- Exécutable;
- Titre final du jeu.

Si vous utilisez `RetroArch` ou un émulateur similaire pour ajouter le même jeu, mais sur différentes consoles, vous rencontrerez le problème où seulement **un** des jeux sera ajouté. Cela est dû à des APP ID identique.

## Ajouter des jeux identiques de différentes consoles

Les APP ID Steam ne peuvent pas être identique. This can be achieved by changing **Title modifier** value or enabling **Append arguments to executable**. Second option adds a third variable to APP ID:

- Executable;
- Final app title;
- Command line arguments.

Most of the time command line will contain unique game path which should allow to generate unique APP IDs.
