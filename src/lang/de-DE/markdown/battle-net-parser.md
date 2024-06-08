# Battle.net-Parser

Dieser Parser importiert Spiele von der `Battle.net`-App. Dadurch können Artworks ausgewählt und in Steam hinzugefügt werden. Wenn dies nicht funktioniert, liegt es daran, dass Blizzard die Struktur ihrer Datenbank verändert hat. Informiere in diesem Fall bitte die Entwickler von SRM, damit diese das Problem lösen können.

Der `Battle.net`-Parser ist etwas speziell, da er ein Shell-Skript unter `${srmDir}/scripts/bnet.ps1` verwendet um `Battle.net` zu starten, eine angemessene Zeit zu warten und erst dann den eigentlichen Titel zu starten.
