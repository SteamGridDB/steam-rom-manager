# Parser-Variablen

Hier sind Tabellen von Variablen, die mit Optionen verwendet werden können, die `[Variablen unterstützen]`{.noWrap} in ihren Beschreibungen angegeben haben. Variable kann geschachtelt werden.

## Verzeichnis-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Corresponding value                     |
| -----------------------------------------------------:|:--------------------------------------- |
|                                           `${exeDir}` | Ausführbares Verzeichnis                |
|                                           `${romDir}` | ROM-Verzeichnis                         |
|                                         `${steamDir}` | Steam-Verzeichnis                       |
|                                       `${startInDir}` | "Startin"-Verzeichnis                   |
|                                          `${fileDir}` | Files returned by a parser or a directory |

Falls die ausführbare Verzeichniseingabe **leer bleibt**, ist `${exeDir}`{.noWrap} gleich `${fileDir}`{.noWrap}. Außerdem ist, wenn das Verzeichnis "StartIn" **leer** gelassen wird, `${startInDir}`{.noWrap} gleich `${exeDir}`{.noWrap}.

## Namen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                             |
| -----------------------------------------------------:|:--------------------------------------------------------------- |
|                                          `${exeName}` | Name of executable (without extension)                          |
|                                         `${fileName}` | Name of file which was returned by a parser (without extension) |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exeName}`{.noWrap} gleich `${fileName}`{.noWrap}.

## Extension variables

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                           |
| -----------------------------------------------------:|:------------------------------------------------------------- |
|                                           `${exeExt}` | Extension of executable (with a dot)                          |
|                                          `${fileExt}` | Extension of file which was returned by a parser (with a dot) |

In case executable directory input is left **empty**, `${exeExt}`{.noWrap} is equal to `${fileExt}`{.noWrap}.

## Pfad-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                |
| -----------------------------------------------------:|:-------------------------------------------------- |
|                                          `${exePath}` | Full path to an executable                         |
|                                         `${filePath}` | Full path to a file which was returned by a parser |

In case executable directory input is left **empty**, `${exePath}`{.noWrap} is equal to `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                              |
| -----------------------------------------------------:|:------------------------------------------------ |
|                                            `${title}` | Extracted title                                  |
|                                       `${fuzzyTitle}` | Fuzzy matched title                              |
|                                       `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Funktionsvariablen

|       Variable (Groß- und Kleinschreibung unberücksichtigt) | Corresponding function                                                                                                 |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

### Beispiel für Funktionsvariablen

Nehmen wir an, dass die `${title}` Variable mit `Pokémon (USA) (Disc 1).iso` übereinstimmt. Dann werden diese Variablen:
```
${/.*/|${title}}                           //Matches everything
${/(.*)/|${title}}                         //Captures everything
${/(\(.*?\))/|${title}|}                   //Captures all brackets and substitutes with nothing
${/(\(Disc\s?[0-9]\))/|${title}}           //Captures "Disc..." part
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Captures "Disc..." part and transforms it to uppercase
${rdc|${title}}                            //Replace diacritic characters (in this case: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Selects correct file extension for OS
```
durch diese ersetzt:
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
