# Häufig gestellte Fragen

Lies dies, wenn du immer noch Probleme mit der Konfiguration hast. Für die meisten Beispiele wird Folgendes verwendet, sofern nicht anders angegeben:

|                     |                                            |
| ------------------- | ------------------------------------------ |
| **ROM Verzeichnis** | `C:/ROMs`                                  |
| **Datei 1**         | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **Datei 2**         | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **Datei 3**         | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **Datei 4**         | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **Datei 5**         | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **Datei 6**         | `C:/ROMs/dir1/dir2/save.sav`               |

## Wie konfiguriere ich Benutzer-Globs?

Analysieren wir zuerst **File1**. Der absolute Pfad sei `C:/ROMs/Kingdom Hearts/game.iso`. Da unser **ROMs Verzeichnis** `C:/ROMs` ist, können wir es aus dem Pfad von **File1** entfernen.

Dann erhalten wir `Kingdom Hearts/game.iso`. Für uns ist es offensichtlich, das `Kingdom Hearts` der Titel ist, für den Parser leider nicht - -so müssen wir den Teil des Pfades `Kingdom Hearts` mit`${title}` ersetzen.

So enden wir mit `${title}/game.iso`, aber wir wollen auch **File2**, denn diese Datei ist für den gleichen Emulator. **File1** ist `game.iso` und **File2** ist `rom.iso`. Was nun?

Erinnerst du dich an Wildcards? Diese erlauben uns Informationen wegzuwerfen, die uns nicht interessieren. In diesem Fall ist es uns egal, ob es `game` oder `rom` ist, wir wollen beide erfassen. Deswegen ersetzen wir sie mit `*`. Dies ist der abschließende Glob für **File1** und **File2**:

```
${title}/*.iso
```

Mit ähnlicher Logik können wir Globs für **File3** erstellen:

```
*/*/*/${title}.nes
```

## Wie gehe ich mit mehrstufigen Verzeichnissen um?

Diesmal wollen wir **File3** und **File5** (beide haben unterschiedliche Erweiterungen, Lies den nächsten Abschnitt darüber, was zu tun ist, da wir derzeit `*` verwenden, um die Erweiterung zu ignorieren). Beachte, dass **File3** `3` Unterverzeichnisse hat, während  **Datei 5** `2` hat. Was nun?

Jetzt können wir einen Globstar benutzen und das war's!
```
**/${title}.*
```
Ist es wirklich so einfach? **Nein!** Globstar wird Auswirkungen auf die Leistung des Parsers haben, wenn es viele Unterverzeichnisse mit jeweils Tausenden von Dateien gibt. Globstar wird sicherstellen, dass der Parser jede Datei überprüft, die er finden kann. Ein Benutzer hat einmal gemeldet, dass das Parsen ~10 Minuten dauerte, als er überall Globstars verwendete.

Eine empfohlene Lösung ist die Verwendung von geklammerten Sätzen. Diese können aus `1` Glob mehrere machen. Wenn wir einen Glob wie folgt schreiben:

```
{*,*/*}/*/${title}.*
```

erhalten wir `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

Diese `2` globs enthält unsere Dateien, **File3** und **File5**.

## Wie kann ich Dateiendungen begrenzen?

Nehmen wir einmal an, wir verwenden den Glob vom vorherigen Beispiel:

```
{*,*/*}/*/${title}.*
```

Wir werden vier Dateien erhalten: **Datei3**, **Datei4**, **Datei5** und **Datei6**. Nun benötigen wir **File4** und **File6** nicht. Normalerweise könnten wir den Glob dann wie folgt setzen:

```
{*,*/*}/*/${title}.nes
```

aber dann werden wir nur mit **File3** enden, denn `nes` ist nicht gleich `NES` -- der Parser berücksichtigt die Groß-/Kleinschreibung. Es gibt zwei Möglichkeiten, dieses Problem mithilfe des erweiterten Glob-Matchers zu lösen.

### `sav` Dateiendungen ausschließen

Erweitern des Glob Matcher `!(...)` erlaubt es uns Sachen zu exkludieren. Schreibe deinen Glob so:

```
{*,*/*}/*/${title}.!(sav)
```

und Dateien mit `sav` Erweiterung werden ausgeschlossen.

### Auf mehrere Erweiterungen prüfen

Erweitern des Glob Matcher `@(...)` erlaubt es uns mehrere Dinge zu erfassen. Schreibe deinen Glob so:

```
{*,*/*}/*/${title}.@(nes|NES)
```

und nur Dateien mit `nes` und `NES` werden abgeglichen. Wenn du Dateien mit Endungen wie `nes`, `NES`, `neS`, `nEs`, `Nes` usw. hast, brauchst du einen Glob der eine Reihenfolge erfasst:

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

Jetzt kann der Parser jeder Kombination entsprechen und ist effektiv unabhängig von Groß- und Kleinschreibung. Technisch wird auch der folgende Glob funktionieren, aber der obige sieht besser aus.

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## Fehlerbehebung
* Bitte stelle sicher, dass Steam tatsächlich geschlossen ist, bevor du deine App-Liste speicherst.

* Ein häufig auftretendes Problem ist das Vorhandensein alter Steam-Verzeichnisse von Leuten, die sich vor dem Update der neuen Bibliothek in deinem Computer eingeloggt haben. Dies kann dazu führen, dass der Steam ROM Manager auf unvorhersehbare Weise fehlschlägt, da er versucht, auf Verzeichnisse zuzugreifen, deren Struktur sich geändert hat. Um dies zu umgehen, verwende das [Benutzerkonten](#user-accounts) Feld um festzulegen, mit welchen Konten du Steam ROM Manager verwenden möchtest.

## Der Discord

Für weitere Hilfe, schau dir bitte unseren [Discord](https://discord.gg/bnSVJrz) an.
