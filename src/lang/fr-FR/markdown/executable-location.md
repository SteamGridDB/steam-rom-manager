# Exécutable `[supporte les variables d'environnement]`

Chemin vers l'exécutable de l'émulateur. Peut être un fichier ou n'importe quel chemin valide.

## Pourquoi optionnel ?

Dans certains cas, il peut être souhaitable de lancer le jeu depuis un script batch qui lancera également l'émulateur lui-même. Si tel est le cas, alors il n'est pas nécessaire de renseigner l'exécutable.

Le dernier raccourci sera simplement `"${filePath}" --command-line-args`.

### Alors, comment ajouter des fichiers à Steam sans exécutable par défaut ?

Tous les fichiers récupérés par un analyseur seront traités comme des exécutables.
