# Parser-Variablen

Hier findest du eine Sammlung von Variablen, die mit Optionen verwendet werden können, die `[unterstützt Variablen]`{.noWrap} in ihren Beschreibungen haben. Variable kann geschachtelt werden.

## Verzeichnis

| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                               |
| ---------------------------------------------------------:|:-------------------------------------------------- |
|                                               `${exeDir}` | Ausführbares Verzeichnis                           |
|                                               `${romDir}` | ROM-Verzeichnis                                    |
|                                             `${steamDir}` | Steam-Verzeichnis                                  |
|                                           `${startInDir}` | "Starte in"-Verzeichnis                            |
|                                              `${fileDir}` | Vom Parser zurückgegebene Dateien oder Verzeichnis |

Falls die Eingabe für `${exeDir}`{.noWrap} **leer** bleibt, ist es gleich `${fileDir}`{.noWrap}. Falls die Eingabe für `${startInDir}`{.noWrap} **leer ** bleibt, ist es gleich `${exeDir}`{.noWrap}.

## Namen

| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                                         |
| ---------------------------------------------------------:|:------------------------------------------------------------ |
|                                              `${exeName}` | Name der ausführbaren Datei (ohne Dateiendung)               |
|                                             `${fileName}` | Name der vom Parser zurückgegebenen Datei (ohne Dateiendung) |

Falls die Eingabe für `${exeName}`{.noWrap} **leer ** bleibt, ist es gleich `${fileName}`{.noWrap}.

## Dateiendungen

| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                                    |
| ---------------------------------------------------------:|:------------------------------------------------------- |
|                                               `${exeExt}` | Erweiterung der ausführbaren Datei (mit Punkt)          |
|                                              `${fileExt}` | Endung der vom Parser zurückgegebenen Datei (mit Punkt) |

Falls die Eingabe für `${exeExt}`{.noWrap} **leer ** bleibt, ist es gleich `${fileExt}`{.noWrap}.

## Pfade

| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                                               |
| ---------------------------------------------------------:|:------------------------------------------------------------------ |
|                                              `${exePath}` | Komplette Pfadangabe zur ausführbaren Datei                        |
|                                             `${filePath}` | Komplette Pfadangabe zur Datei, die vom Parser zurückgegeben wurde |

Falls die Eingabe für `${exePath}`{.noWrap} **leer ** bleibt, ist es gleich `${filePath}`{.noWrap}.

## Parser-Variablen

| Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Wert                                         |
| ---------------------------------------------------------:|:-------------------------------------------- |
|                                                `${title}` | Extrahierter Titel                           |
|                                           `${fuzzyTitle}` | Fuzzy Matched Titel                          |
|                                           `${finalTitle}` | Titel nachdem "Titel ändern" angewandt wurde |
|                                          `${parserTitle}` | The value of the `Parser Title` field        |

Falls Fuzzy Matching **fehlschlägt** oder **deaktiviert** ist, ist `${fuzzyTitle}`{.noWrap} gleich `${title}`{.noWrap}.

## Funktionen

|   Variable (Groß- und Kleinschreibung nicht berücksichtigt) | Funktion                                                                                                                                       |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Wendet Regex auf den Input an. Unterstützt `u`, `g` und `i` Flags(Gruppierungen werden zusammengefasst, wenn keine Substitution angegeben ist) |
|                                             `${uc\|input}` | Groß geschriebene Variable. Wandelt Input in Großbuchstaben um                                                                                 |
|                                             `${lc\|input}` | Klein geschriebene Variable. Wandelt Input in Kleinbuchstaben um                                                                               |
|                                       `${cv:group\|input}` | Ersetzt den Input mit benutzerdefinierten Variablen (group ist optional)                                                                       |
|                                            `${rdc\|input}` | Ersetzt diakritische Zeichen mit der lateinischen Variante                                                                                     |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | Wenn das Betriebssystem matcht, wird `on match` angewandt, ansonsten `no match`                                                                |

### Beispiel für Funktionen

Nehmen wir an, dass die `${title}` Variable mit `Pokémon (USA) (Disc 1).iso` übereinstimmt. Dann werden diese Variablen:

```
${/.*/|${title}}                           //Matched alles
${/(.*)/|${title}}                         //Gruppiert alles
${/(\(.*?\))/|${title}|}                   //Erfasst alle Klammern und ersetzt mit nichts
${/(\(Disc\s?[0-9]\))/|${title}}           //Erfasst den "Disc..." Teil
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Erfasst den "Disc..." Teil und wandelt ihn in Großbuchstaben um
${rdc|${title}}                            //Ersetzt diakritische Zeichen (hier: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Wählt die korrekte Dateiendung für ein Betriebssystem
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
