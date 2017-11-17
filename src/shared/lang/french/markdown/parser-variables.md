# Variables d'analyse

Voici un tableau des variables qui peuvent être utilisées avec les options suivantes `[supports variables]`{.noWrap} spécifiés dans leurs descriptions.

|Variable (case-insensitive)|Valeurs correspondantes|
|---:|:---|
|`${dir}`|Répertoire ROMs|
|`${title}`|titre extrait|
|`${fuzzyTitle}`|titre concordant approximatif|
|`${finalTitle}`|extrait le titre qui a été modifié par le modificateur de titre|
|`${fuzzyFinalTitle}`|titre assorti approximatif qui a été modifié par le modificateur de titre|
|`${file}`|nom de fichier d'un fichier retourné par un analyseur|
|`${filePath}`|chemin complet vers un fichier retourné par un analyseur|
|`${sep}`|séparateur de répertoire spécifique au système: `\` ou `/`|

En cas d'échec ou de désactivation de la concordance floue, `${fuzzyTitle}`{.noWrap} est égal à `${title}`{.noWrap}.
