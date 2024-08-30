# Epic Games-parser

Deze parser importeert games uit de [Epic Games Store](https://store.epicgames.com/en-US/) zodat er illustraties voor kunnen worden gekozen en ze kunnen worden toegevoegd aan Steam.

Als het niet werkt, komt dat omdat Epic de structuur van hun spelmanifesten heeft gewijzigd. Laat het in dit geval de ontwikkelaars van SRM weten en we zullen het probleem oplossen.

Om deze parser te laten werken met het open source Epic-alternatief [Legendary](https://github.com/derrod/legendary), moet [EGL-synchronisatie zijn ingeschakeld in Legendary](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748) (hierdoor worden de juiste bestanden gemaakt die de parser kan lezen, en vereist niet dat de `Epic Games Store` is geïnstalleerd).

Dat gezegd hebbende, er is ook een `Legendary` parser in SRM die direct uit de doos werkt.

## Compatibiliteit

Deze parser werkt momenteel alleen op `Windows`- en `Mac OS`-systemen. Op `Mac OS` is het niet mogelijk om te starten vanuit de Epic Store, dus die schakelaar moet uitgeschakeld blijven.
