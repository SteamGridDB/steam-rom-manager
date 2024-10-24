# Command line arguments `[supports variables]`{.noWrap}

Arguments which are appended to executable to produce final shortcut. Most of the time you will want to set it using provided parser variables.

## Exemples par Système

### RetroArch

```
-L cores${/}VOTRE_COEUR.dll "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### Dolphin Emu (Gamecube et Wii)

```
--exec="${filePath}" --batch --confirm=false
```

### Project64 2.3+ (N64)

```
"${filePath}"
```

### Mupen64+ (N64)

```
--fullscreen "${filePath}"
```

### DeSmuME (Nintendo DS)

```
"${filePath}"
```

### mGBA (Gameboy, Gameboy Color, et Gameboy Advance)

```
-f "${filePath}"
```

### Nestopia (NES/Famicom)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen width : 1024 -video fullscreen height : 768 -preferences fullscreen on start : yes -view size fullscreen : stretched
```

### higan (NES/Famicom, SNES/Famicom, Gameboy, Gameboy Color, Gameboy Advance)

```
"${filePath}"
```

### nullDC (Sega Dreamcast)

```
-config nullDC_GUI:Fullscreen=1 -config ImageReader:DefaultImage="${filePath}"
```

### Kega Fusion (Sega Genesis et Sega 32X)

```
"${filePath}" -gen -auto -fullscreen
```

### RPCS3 (Sony Playstation 3)

```
"${filePath}"
```

### PCSX2 (Sony Playstation 2)

```
--fullscreen --nogui "${filePath}"
```

### PCSX-R (Sony Playstation 1)

```
-nogui -cdfile "${filePath}"
```

### ePSXe (Sony Playstation 1)

```
-f -nogui -loadbin "${filePath}"
```

### Xebra (Sony Playstation 1)

```
-IMAGE "${filePath}" -RUN1 -FULL
```

### Mednafen (Sony Playstation 1, NES/Famicom, SNES/Super Famicom, etc.)

```
"${filePath}"
```

### PPSSPP (Sony Playstation Portable)

```
"${filePath}"
```

## Que fait "Ajouter des arguments à l'exécutable"?

Au lieu d'ajouter des arguments dans les options de lancement de Steam:

![Arguments non ajoutés](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

les arguments sont ajoutés à la cible comme indiqué ci-dessous:

![Arguments ajoutés](../../../assets/images/cmd-appended.png) {.fitImage.center}

Ce paramètre est utilisé pour influer sur l'APP ID de Steam.

## Variables de répertoire

| Variable (insensible à la casse) | Valeur correspondante                     |
| --------------------------------:|:----------------------------------------- |
|                      `${exeDir}` | Répertoire exécutable                     |
|                      `${romDir}` | Répertoire des ROMs                       |
|                    `${steamDir}` | Répertoire Steam                          |
|                  `${startInDir}` | Répertoire "Démarrer"                     |
|                     `${fileDir}` | Files returned by a parser or a directory |

Dans le cas où l'entrée du répertoire exécutable est laissée **vide**, `${exeDir}`{.noWrap} est égal à `${fileDir}`{.noWrap}. De plus, si le répertoire "Démarrer" est laissé **vide**, `${startInDir}`{.noWrap} est égal à `${exeDir}`{.noWrap}.

## Nom des variables

| Variable (insensible à la casse) | Valeur correspondante                                               |
| --------------------------------:|:------------------------------------------------------------------- |
|                     `${exeName}` | Nom de l'exécutable (sans extension)                                |
|                    `${fileName}` | Nom du fichier qui a été retourné par un analyseur (sans extension) |

Dans le cas où l'entrée nom de l'exécutable est laissée **vide**, `${exeName}`{.noWrap} est égal à `${fileName}`{.noWrap}.

## Variables d'extension

| Variable (insensible à la casse) | Valeur correspondante                                                     |
| --------------------------------:|:------------------------------------------------------------------------- |
|                      `${exeExt}` | Extension de l'exécutable (avec un point)                                 |
|                     `${fileExt}` | Extension de fichier qui a été retournée par un analyseur (avec un point) |

Dans le cas où l'entrée extension de l'exécutable est laissée **vide**, `${exeExt}`{.noWrap} est égal à `${fileExt}`{.noWrap}.

## Variables de chemin

| Variable (insensible à la casse) | Valeur correspondante                                              |
| --------------------------------:|:------------------------------------------------------------------ |
|                     `${exePath}` | Chemin complet vers un exécutable                                  |
|                    `${filePath}` | Chemin complet vers un fichier qui a été retourné par un analyseur |

Dans le cas où l'entrée chemin complet vers un exécutable est laissée **vide**, `${exePath}`{.noWrap} est égal à `${filePath}`{.noWrap}.

## Variables d'analyseur

| Variable (insensible à la casse) | Valeur correspondante                            |
| --------------------------------:|:------------------------------------------------ |
|                       `${title}` | Extracted title                                  |
|                  `${fuzzyTitle}` | Fuzzy matched title                              |
|                  `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Function variables

|                            Variable (insensible à la casse) | Corresponding function                                                                                                 |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------- |
|                                                          `` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
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
