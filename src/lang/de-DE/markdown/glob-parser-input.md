# Glob Parser specific inputs

## Benutzer-Glob

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob.

## Wie funktioniert es?

In addition to special glob characters, glob parser requires you to enter `${title}`{.noWrap} variable. Parser will locate it's position inside your **glob**, for example:

| Benutzer-Glob          | Position                    |
| ---------------------- | --------------------------- |
| `${title}/*/*.txt`     | First level from the left   |
| `{*,*/*}/${title}.txt` | First level from the right  |
| `**/${title}/*.txt`    | Second level from the right |

Nach dem Erreichen der `${title}`{.noWrap} Position, wird `${title}`{.noWrap} durch einen Platzhalter `*` ersetzt.

## Einschränkungen

Position extraction comes with some limitations -- glob is invalid if position can not be extracted. Meistens wirst du davor gewarnt, was du nicht tun kannst. Solltest du jedoch eine Kombination finden, die erlaubt ist, aber falsche Titel erzeugt, gib uns dieses Problem bitte auf [github](https://github.com/FrogTheFrog/steam-rom-manager/issues) weiter.
