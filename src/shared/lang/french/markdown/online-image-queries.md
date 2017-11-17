# Demande d'image en ligne `[supports variables]`{.noWrap}

Requêtes utilisées pour rechercher des images. Pour définir la requête image, la syntaxe suivante doit être utilisée:
```
${...}
```
Par exemple, les images pour "Legend of Zelda" et "The Legend of Zelda: A Link to the Past" peuvent être interrogées comme ceci:
```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```
Vous voudrez très probablement utiliser des variables d'analyseur pour les requêtes. Qui ressemblera à ceci (aussi la **default** valeur):
```
${${fuzzyTitle}}
```
La transmission **greedy** peut être activé en réglant la requête sur
```
${${fuzzyTitle}}${${title}}
```
