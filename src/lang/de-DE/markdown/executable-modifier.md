# Programmdatei ändern`[unterstützt Variablen]`{.noWrap}

Default value is `"${exePath}"`{.noWrap}. This setting can be used to prepend or append desired characters to an executable which will be added to Steam (`Target` property). For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you can add `"cmd" /k start /min` to it by setting value to:
```
"cmd" /k start /min "${exePath}"
```
Du kannst jede andere Variable verwenden, um die endgültige ausführbare Datei zu erstellen.

This setting influences Steam's APP ID.


## Shortcut Passthrough
If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser.

## Verzeichnis-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                  |
| -----------------------------------------------------:|:---------------------------------------------------- |
|                                           `${exeDir}` | Verzeichnis der Programmdatei                        |
|                                           `${romDir}` | ROM-Verzeichnis                                      |
|                                         `${steamDir}` | Steam Verzeichnis                                    |
|                                       `${startInDir}` | "Starte in"-Verzeichnis                              |
|                                          `${fileDir}` | Dateien, von einem Parser zurückgegeben, Verzeichnis |

Falls der Input für Programmdateien-Verzeichnis **leer**gelassen wurde, ist `${exeDir}`{.noWrap} gleich `${fileDir}`{.noWrap}. Außerdem ist, wenn das Verzeichnis "Starte in" **leer** gelassen wird, `${startInDir}`{.noWrap} gleich `${exeDir}`{.noWrap}.

## Namen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| -----------------------------------------------------:|:--------------------------------------------------------------------------- |
|                                          `${exeName}` | Name der ausführbaren Datei (ohne Erweiterung)                              |
|                                         `${fileName}` | Name der Datei, die von einem Parser zurückgegeben wurde (ohne Erweiterung) |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exeName}`{.noWrap} gleich `${fileName}`{.noWrap}.

## Dateiendungen-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                          |
| -----------------------------------------------------:|:---------------------------------------------------------------------------- |
|                                           `${exeExt}` | Erweiterung der ausführbaren Datei (mit einem Punkt)                         |
|                                          `${fileExt}` | Dateierweiterung, die von einem Parser (mit einem Punkt) zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exeExt}`{.noWrap}gleich `${fileExt}`{.noWrap}.

## Pfad-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                                         |
| -----------------------------------------------------:|:--------------------------------------------------------------------------- |
|                                          `${exePath}` | Vollständiger Pfad zu einer ausführbaren Datei                              |
|                                         `${filePath}` | Vollständiger Pfad zu einer Datei, die von einem Parser zurückgegeben wurde |

Falls die ausführbare Verzeichniseingabe **leer** gelassen wurde, ist `${exePath}`{.noWrap} gleich `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechender Wert                                   |
| -----------------------------------------------------:|:----------------------------------------------------- |
|                                            `${title}` | Extrahierter Titel                                    |
|                                       `${fuzzyTitle}` | Fuzzy Matched Titel                                   |
|                                       `${finalTitle}` | Titel, der das Endergebnis des Titel-Modifikators war |

Falls Fuzzy Matching **fehlschlägt** oder **deaktiviert** ist, ist `${fuzzyTitle}`{.noWrap} gleich `${title}`{.noWrap}.

## Funktions-Variablen

|       Variable (Groß- und Kleinschreibung unberücksichtigt) | Entsprechende Funktion                                                                                                          |
| -----------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Führt Regex auf dem Input aus. Unterstützt `u`, `g` und `i` Flags(Gruppen werden zusammengefügt, außer Ersetzung ist angegeben) |
|                                             `${uc\|input}` | Großbuchstaben-Variable. Wandelt Eingaben in Großbuchstaben um                                                                  |
|                                             `${lc\|input}` | Kleinbuchstaben-Variable. Wandelt Eingaben in Kleinbuchstaben um                                                                |
|                                     `${cv:group\|Eingabe}` | Ändert die Eingabe mit angepasster benutzerdefinierter Variable (Gruppe ist optional)                                           |
|                                            `${rdc\|input}` | Ersetzt diakritische Eingabezeichen mit ihrem lateinischen Äquivalent                                                           |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | Wenn das Betriebssystem übereinstimmt, benutze den `on match` Wert ansonsten den `no match`                                     |

### Beispiel für Funktions-Variablen

Nehmen wir an, dass die `${title}` Variable mit `Pokémon (USA) (Disc 1).iso` übereinstimmt. Dann werden diese Variablen:
```
${/.*/|${title}}                           //Entspricht allem
${/(.*)/|${title}}                         //Gruppiert alles
${/(\(.*?\))/|${title}|}                   //Gruppiert alle Klammern und ersetzt sie durch nichts
${/(\(Disc\s?[0-9]\))/|${title}}           //Gruppiert den "Disc..." Teil
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Gruppiert den "Disc..." Teil und transformiert ihn zu Großbuchstaben
${rdc|${title}}                            //Ersetzt diakritische Zeichen (In diesem Fall: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Setzt die richtige Dateiendung nach Betriebssystem
```
durch diese ersetzt:
```
Pokémon (USA) (Disc 1).iso
Pokémon (USA) (Disc 1).iso
Pokémon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1).iso

--Unter linux:
file.so
--Unter Windows:
file.dll
--Unter Mac OS:
file
```
