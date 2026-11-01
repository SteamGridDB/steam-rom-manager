# Benutzer-Ausnahmen
## Wofür dies nicht verwendet werden soll
Dieses Tool kann verwendet werden, um Ausnahmen pro App festzulegen, die die Parser überschreiben. Es sollte nicht zur Durchführung von Massen-Aufgaben verwendet werden. Zum Beispiel sollte das Entfernen von Doppelpunkten aus Titeln über das "Titel ändern" `${/:/|${title}|}` gemacht werden. Wenn ein Kommandozeilenargument für jede geparste App üblich ist, dann verwende das Kommandozeilenargument-Feld - erstelle hier keine Einträge!

## Extrahierter Titel - *Erforderlich*
Dies ist das einzige erforderliche Feld. Sobald dies gesetzt und gespeichert ist wird jedes Spiel, dass darauf passt seine Felder überschrieben von jedem befüllten Ausnahmenfeld (Wenn es leer gelassen wird, hat das Ausnahmenfeld keine Wirkung).

Das `Extrahierter Titel` Feld vergleicht auf zwei Wege:

* Basierend auf der `Ausnahme ID` (wird durch ausführen der Test Parser findbar). Wenn z.B. für `Portal 1` die`Ausnahme ID` `12345` ist, kannst du in das Feld `Portal 1 ${id:12345}` eingeben. Wenn die `Ausnahme ID` angegeben ist, dann ist es egal, welches Label du davor setzt, aber zur besseren Les- und Findbarkeit ist es besser den Spielenamen vor die `Ausnahme ID` zu setzen.
* Basierend auf dem `Extrahierter Titel` (wird durch ausführen der Test Parser findbar). Wenn z. B. der `Extrahierter Titel` `Portal 2` ist, kannst du in das Feld `Portal 2` eintragen.

So kannst du entweder eine Ausnahme, die auf alle Spiele mit dem gleichen Namen, oder eine die exakt auf ein Spiel passt, angeben (`Ausnahme ID` sind einzigartig). Der Grund hierfür ist hauptsächlich Abwärtskompatibilität - SRM hat früher nur über den `Extrahierter Titel` verglichen.

Exceptions generated from `Add Games` will always be in the form `Extracted Title ${id:XXXXXX}`.

## Neuer Anzeigetitel

Dies ist der Titel, der in Steam angezeigt wird. Er wird nicht für die Suche nach Bildern verwendet.

## Neuer Suchtitel

Dies ist der Titel, der für die Suche nach Bildern in [SteamGridDB](https://www.steamgriddb.com) verwendet wird. Es gibt zwei Möglichkeiten, sie außer Kraft zu setzen:

* Lege einen neuen Titel für die Suche fest.
* Gib die genaue Spiel-Id an, über die Bilder abgerufen werden sollen. Um zum Beispiel Bilder für das Spiel [Flow](https://www.steamgriddb.com/game/5254019) mit der SteamGridDB Url `https://www.steamgriddb.com/game/5254019` zu erhalten, würde man `${gameid:5254019}` eingeben.

## Neue Befehlszeilen-Argumente

Benutzerdefinierte Befehlszeilenargumente wie `--fullscreen`, usw., die auf einen bestimmten Titel angewendet werden können. Diese überschreiben nur das Argumentfeld der Steam-Verknüpfung und werden nie an die ausführbare Datei angehängt.

## Titel ausschließen

Die Möglichkeit, einzelne Titel von der Aufnahme in Steam auszuschließen. Dies ermöglicht es dir, Titel, die du nicht in Steam angezeigt haben möchtest, im gleichen Ordner wie deine anderen Spiele zu behalten.

## Nur lokale Artworks

Verhindert, dass Artworks von Online-Anbietern abgerufen werden (z.B. [steamgriddb](https://www.steamgriddb.com)). Nützlich, wenn SGDB falsche Spiele fidnet oder du keins der verfügbaren Artworks magst.

## Benutzerdefinierte Variablen
EInzelne Titel zu überschreiben kann manuell in der JSON Dateil gemacht werden und indem man pasende Variablen im `Titel ändern` Feld ändert. Allerdings wird empfohlen dieses Tool stattdessen zu nutzen, da die JSON Datei im Laufe der Zeit aktualisiert werden und deine Änderungen überschreiben können.
