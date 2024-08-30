# Variables d'analyseur

Voici des tables de variables qui peuvent être utilisées avec des options qui ont `[prend en charge les variables]`{.noWrap} spécifiées dans leurs descriptions. Les variables peuvent être imbriquées.

## Variables de répertoire

| Variable (insensible à la casse) | Valeur correspondante                           |
| -------------------------------: | :---------------------------------------------- |
|                      `${exeDir}` | Répertoire exécutable                           |
|                      `${romDir}` | Répertoire des ROMs                             |
|                    `${steamDir}` | Répertoire Steam                                |
|                  `${startInDir}` | Répertoire "Démarrer"                           |
|                     `${fileDir}` | Fichiers retournés par un analyseur, répertoire |

Dans le cas où l'entrée du répertoire exécutable est laissée **vide**, `${exeDir}`{.noWrap} est égal à `${fileDir}`{.noWrap}. De plus, si le répertoire "Démarrer" est laissé **vide**, `${startInDir}`{.noWrap} est égal à `${exeDir}`{.noWrap}.

## Nom des variables

| Variable (insensible à la casse) | Valeur correspondante                                               |
| -------------------------------: | :------------------------------------------------------------------ |
|                     `${exeName}` | Nom de l'exécutable (sans extension)                                |
|                    `${fileName}` | Nom du fichier qui a été retourné par un analyseur (sans extension) |

Dans le cas où l'entrée nom de l'exécutable est laissée **vide**, `${exeName}`{.noWrap} est égal à `${fileName}`{.noWrap}.

## Variables d'extension

| Variable (insensible à la casse) | Valeur correspondante                                                     |
| -------------------------------: | :------------------------------------------------------------------------ |
|                      `${exeExt}` | Extension de l'exécutable (avec un point)                                 |
|                     `${fileExt}` | Extension de fichier qui a été retournée par un analyseur (avec un point) |

Dans le cas où l'entrée extension de l'exécutable est laissée **vide**, `${exeExt}`{.noWrap} est égal à `${fileExt}`{.noWrap}.

## Variables de chemin

| Variable (insensible à la casse) | Valeur correspondante                                              |
| -------------------------------: | :----------------------------------------------------------------- |
|                     `${exePath}` | Chemin complet vers un exécutable                                  |
|                    `${filePath}` | Chemin complet vers un fichier qui a été retourné par un analyseur |

Dans le cas où l'entrée chemin complet vers un exécutable est laissée **vide**, `${exePath}`{.noWrap} est égal à `${filePath}`{.noWrap}.

## Variables d'analyseur

| Variable (insensible à la casse) | Valeur correspondante                            |
| -------------------------------: | :----------------------------------------------- |
|                       `${title}` | Extracted title                                  |
|                  `${fuzzyTitle}` | Fuzzy matched title                              |
|                  `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Function variables

|                        Variable (insensible à la casse) | Corresponding function                                                                                                 |
| ------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------- |
|               `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                          `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                          `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                    `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                         `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

### Function variable example

Let's say that `${title}` variable equals to `Pokémon (USA) (Disc 1).iso`. Then these variables:

```
${/.*/|${title}}                           //Matches everything
${/(.*)/|${title}}                         //Captures everything
${/(\(.*?\))/|${title}|}                   //Captures all brackets and substitutes with nothing
${/(\(Disc\s?[0-9]\))/|${title}}           //Captures "Disc..." part
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Captures "Disc..." part and transforms it to uppercase
${rdc|${title}}                            //Replace diacritic characters (in this case: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Selects correct file extension for OS
```

will be replaced with these:

```
Pokémon (USA) (Disc 1).iso
Pokémon (USA) (Disc 1).iso
Pokémon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1).iso

--On linux:
file.so
--On Windows:
file.dll
--On Mac OS:
file
```
