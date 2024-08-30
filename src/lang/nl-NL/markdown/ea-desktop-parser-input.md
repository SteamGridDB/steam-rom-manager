# EA Desktop Parser-specifieke inputs

## EA Games Directory Override

Standaard gaat Steam ROM Manager ervan uit dat je `EA Desktop`-spellen zijn geïnstalleerd in ``C:\Program Files\EA Games\`. Met dit veld kun je dat wijzigen naar waar je games geïnstalleerd zijn, bijv.``D:\Games\EA Games`.

## Launch Games Via EA Desktop

Indien ingeschakeld, SRM voegt een snelkoppeling toe naar `origin2://game/launch/?offerIds=${gameid}` in plaats van alleen het uitvoerbare bestand van de game. Dit zorgt ervoor dat de game via EA wordt gelanceerd en toegang heeft tot online services.

`Dit is vereist om EA Play-games toe te voegen. EA Play-games worden niet gedetecteerd als dit niet is ingeschakeld.`
