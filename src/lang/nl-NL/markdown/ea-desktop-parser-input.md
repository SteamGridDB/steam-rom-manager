# EA Desktop Parser specific inputs

## EA-desktopgameslijst
Standaard gaat Steam ROM Manager ervan uit dat je `EA Desktop`-spellen zijn geïnstalleerd in ``C:\Program Files\EA Games\`. Met dit veld kun je dat wijzigen naar waar je games geïnstalleerd zijn, bijv.``D:\Games\EA Games`.

## Launch via EA Desktop
If enabled SRM will add a shortcut to `origin2://game/launch/?offerIds=${gameid}` instead of just the game's executable. This ensures the game launches via EA and will have access to online services.

`This is required to add EA Play games. EA Play games will not be detected if this is not toggled on.`
