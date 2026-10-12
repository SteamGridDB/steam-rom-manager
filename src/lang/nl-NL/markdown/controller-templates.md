# Controller sjablonen
Met controller-sjablonen kunt u de knoppen-indeling per controller en per parser configureren.

Je kunt `Cloud-synchronisatie` in Steam uitschakelen om te voorkomen dat je SRM toegewezen controller configuraties worden overschrijven. Je kunt de instelling vinden onder `Steam > Instellingen > Cloud`.

Een template maken:
* Steam openen.
* Verbind de controller waarvoor je een template wilt configureren.
* Klik met de rechtermuisknop op een spel en druk op `Beheren > Controller Layout`.
* Configureer de knoppen zoals je wil.
* Klik op `Configuratie exporteren` en vervolgens op `Nieuwe sjabloonbinding opslaan`.
* Geef de sjabloon een naam in het formulier: `Templatetitel (SRM)`. De naam moet eindigen met `(SRM)`, anders neemt SRM het sjabloon niet op.
* Herhaal dit voor zoveel verschillende soorten controllers als u wilt configureren.

In de SRM parser:
* Druk op `Fetch Controller-sjablonen` om sjablonen voor alle controllertypen uit Steam op te halen. Hiermee wordt je momenteel geselecteerde sjabloon gewist als het niet één van de sjablonen is die beschikbaar zijn in Steam.

Momenteel haalt SRM alle standaard (door Valve gemaakte) sjablonen voor elke controller op, evenals alle door de gebruiker gedefinieerde sjablonen die eindigen op `(SRM)`.

* Kies uw sjablonen en sla de parser op. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* Om controllerconfiguraties ongedaan te maken, kun je ofwel `Alle toegevoegde app-items verwijderen` in de algemene instellingen (hierdoor worden alle door SRM aangebrachte wijzigingen in je Steam-gegevens verwijderd) of op `Alle controllers ongedaan maken` klikken in de parser (dit verwijdert alleen controllerinstellingen voor de steam-directory en de gebruiker die in die parser is opgegeven).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


