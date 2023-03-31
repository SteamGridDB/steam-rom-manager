# Häufig gestellte Fragen

Lies dies, wenn du immer noch Probleme mit der Konfiguration hast. Für die meisten Beispiele wird Folgendes verwendet, sofern nicht anders angegeben:

|                    |                                            |
| ------------------ | ------------------------------------------ |
| **ROMs directory** | `C:/ROMs`                                  |
| **Datei 1**        | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **Datei 2**        | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **Datei 3**        | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **Datei 4**        | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **Datei 5**        | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **Datei 6**        | `C:/ROMs/dir1/dir2/save.sav`               |

## So, how do I setup user's glob?

First, let's analyze **File1**. Its full path is `C:/ROMs/Kingdom Hearts/game.iso`. Since our **ROMs directory** is `C:/ROMs`, we can just remove it from **File1**'s path.

We end up with `Kingdom Hearts/game.iso`. It obvious for us that `Kingdom Hearts` is the title, however parser is dumber than you -- you must specify path portion which contains the title by replacing `Kingdom Hearts` with `${title}`.

Again, we end up with `${title}/game.iso`, but we also want **File2**, because it is for the same emulator. **File1** is `game.iso` and **File2** is `rom.iso`. What now?

Remember wild cards? They allow us to discard information that does not really matter. In this case we don't care if it is `game` or `rom`, we want both to be matched. That's why we replace them with `*`. This is the final glob for both **File1** and **File2**:

```
${title}/*.iso
```

Using similar logic we can produce glob for **File3**:

```
*/*/*/${title}.nes
```

## How to deal with multi-leveled directories?

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while  **File5** has `2`. What now?

Now we can use a globstar and that's it!
```
**/${title}.*
```
Ist es wirklich so einfach? **Nein!** Globstar wird Auswirkungen auf die Leistung des Parsers haben, wenn es viele Unterverzeichnisse mit jeweils Tausenden von Dateien gibt. Globstar wird sicherstellen, dass der Parser jede Datei überprüft, die er finden kann. Ein Benutzer hat einmal gemeldet, dass das Parsen ~10 Minuten dauerte, als er überall Globstars verwendete.

Eine empfohlene Lösung ist die Verwendung von geklammerten Sätzen. Diese können aus `1` Glob mehrere machen. Wenn wir einen Glob wie folgt schreiben:

```
{*,*/*}/*/${title}.*
```

we will get `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

These `2` globs both satisfy our files, **File3** and **File5**.

## Wie kann ich Dateierweiterungen begrenzen?

Let's say we use glob from previous example:

```
{*,*/*}/*/${title}.*
```

Wir werden vier Dateien erhalten: **Datei3**, **Datei4**, **Datei5** und **Datei6**. Nun benötigen wir **File4** und **File6** nicht. Normalerweise könnten wir den Glob dann wie folgt setzen:

```
{*,*/*}/*/${title}.nes
```

aber dann werden wir nur mit **File3** enden, denn `nes` ist nicht gleich `NES` -- der Parser berücksichtigt die Groß-/Kleinschreibung. Es gibt zwei Möglichkeiten, dieses Problem mithilfe des erweiterten Glob-Matchers zu lösen.

### Exclude `sav` extension

Extended glob matcher `!(...)` allows us to exclude stuff. Simply write glob like this:

```
{*,*/*}/*/${title}.!(sav)
```

and files with `sav` extension will be excluded.

### Check for multiple extensions

Extended glob matcher `@(...)` allows us to match multiple things. Simply write glob like this:

```
{*,*/*}/*/${title}.@(nes|NES)
```

and only files with `nes` and `NES` will be matched. If you're feeling fancy or if you have files with extensions `nes`, `NES`, `neS`, `nEs`, `Nes` and etc., you need a glob that uses character range:

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

Now parser can match any combination and is effectively case-insensitive. Technically, the following glob will work too, but the one above looks better.

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## Fehlerbehebung
* Bitte stelle sicher, dass Steam tatsächlich geschlossen ist, bevor du deine App-Liste speicherst.

* Ein häufig auftretendes Problem ist das Vorhandensein alter Steam-Verzeichnisse von Leuten, die sich vor dem Update der neuen Bibliothek in deinem Computer eingeloggt haben. Dies kann dazu führen, dass der Steam ROM Manager auf unvorhersehbare Weise fehlschlägt, da er versucht, auf Verzeichnisse zuzugreifen, deren Struktur sich geändert hat. Um dies zu umgehen, verwende das [Benutzerkonten](#user-accounts) Feld um festzulegen, mit welchen Konten du Steam ROM Manager verwenden möchtest.

## Der Discord

Für weitere Hilfe, schau dir bitte unseren [Discord](https://discord.gg/bnSVJrz) an.
