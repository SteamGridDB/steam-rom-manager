# Executable modifier `[supports variables]`{.noWrap}

Default value is `"${exePath}"`{.noWrap}. This setting can be used to prepend or append desired characters to an executable which will be added to Steam (`Target` property). For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you can add `"cmd" /k start /min` to it by setting value to:

```
"cmd" /k start /min "${exePath}"
```

Du kannst jede andere Variable verwenden, um die endgültige ausführbare Datei zu erstellen.

This setting influences Steam's APP ID.

## Shortcut Passthrough

If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser.

## Verzeichnis-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                       |
| ----------------------------------------------------: | :---------------------------------------- |
|                                           `${exeDir}` | Executable directory                      |
|                                           `${romDir}` | ROMs directory                            |
|                                         `${steamDir}` | Steam directory                           |
|                                       `${startInDir}` | "StartIn" directory                       |
|                                          `${fileDir}` | Files returned by a parser or a directory |

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}.

## Namen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| ----------------------------------------------------: | :-------------------------------------------------------------------------- |
|                                          `${exeName}` | Name der ausführbaren Datei (ohne Erweiterung)                              |
|                                         `${fileName}` | Name der Datei, die von einem Parser zurückgegeben wurde (ohne Erweiterung) |

In case executable directory input is left **empty**, `${exeName}`{.noWrap} is equal to `${fileName}`{.noWrap}.

## Erweiterungs-Variablen

| Variable (case-insensitive) | Corresponding value                                                          |
| --------------------------: | :--------------------------------------------------------------------------- |
|                 `${exeExt}` | Erweiterung der ausführbaren Datei (mit einem Punkt)                         |
|                `${fileExt}` | Dateierweiterung, die von einem Parser (mit einem Punkt) zurückgegeben wurde |

In case executable directory input is left **empty**, `${exeExt}`{.noWrap} is equal to `${fileExt}`{.noWrap}.

## Path variables

| Variable (case-insensitive) | Entsprechender Wert                                |
| --------------------------: | :------------------------------------------------- |
|                `${exePath}` | Full path to an executable                         |
|               `${filePath}` | Full path to a file which was returned by a parser |

In case executable directory input is left **empty**, `${exePath}`{.noWrap} is equal to `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (case-insensitive) | Corresponding value                              |
| --------------------------: | :----------------------------------------------- |
|                  `${title}` | Extracted title                                  |
|             `${fuzzyTitle}` | Fuzzy matched title                              |
|             `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Funktions-Variablen

|   Variable (Groß- und Kleinschreibung unberücksichtigt) | Corresponding function                                                                                                 |
| ------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------- |
|               `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                          `${uc\|input}` | Großbuchstaben-Variable. Wandelt Eingaben in Großbuchstaben um                                                         |
|                                          `${lc\|input}` | Kleinbuchstaben-Variable. Wandelt Eingaben in Kleinbuchstaben um                                                       |
|                                  `${cv:group\|Eingabe}` | Ändert die Eingabe mit angepasster benutzerdefinierter Variable (Gruppe ist optional)                                  |
|                                         `${rdc\|input}` | Ersetzt diakritische Eingabezeichen mit ihrem lateinischen Äquivalent                                                  |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

### Beispiel für Funktions-Variablen

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
