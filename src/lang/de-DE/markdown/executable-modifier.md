# Programmdatei ändern`[unterstützt Variablen]`{.noWrap}

Standardwert ist `"${exePath}"`{.noWrap}. Diese Einstellung wird genutzt um Zeichen vor oder hinter Programmdateien zu setzen, welche zu Steam hinzugefügt werden (`Target` Eigenschaft). Zum Beispiel, wenn `${exePath}`{.noWrap} `C:\RetroArch\retroarch.exe` entspricht, kannst du `"cmd" /k start /min` hinzufügen in dem du den Wert eingibst:
```
"cmd" /k start /min "${exePath}"
```
Du kannst jede andere Variable verwenden, um die endgültige ausführbare Datei zu erstellen.

Diese Einstellung beeinflusst die Steam's APP-ID.


## Shortcut weiterreichen
Wenn du "Folge .lnk zum Ziel" aktivierst und deine Programmdatei eine ".lnk" Datei ist, zum Beispiel ein Shortcut, dann wird, was du in dieses Feld einträgst, überschrieben mit dem Ziel der Verknüpfung. Wenn du Argumente hinzufügen willst, füge sie dem Ziel des Shortcuts hinzu oder nutze das "Kommandozeilenargumente" Feld im Parser.

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
