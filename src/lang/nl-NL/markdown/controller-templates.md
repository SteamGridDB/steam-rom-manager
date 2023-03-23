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

Currently, SRM pulls all of the default (Valve made) templates for each controller as well as all of the user defined templates that end in `(SRM)`.

* Kies uw sjablonen en sla de parser op. The controller configsets will be applied once you hit `Save App List` in the preview.

* To unset controller configs, you may either `Remove All Added App Entries` from global settings (this deletes all SRM made changes to your steam data) or hit `Unset All Controllers` in the parser (this only removes controller settings for the steam directory and user specified in that parser).

Zodra dit gedaan is, kunt u de preview genereren en opslaan zoals gebruikelijk, en het sjabloon zal worden toegepast op alle titels in de parser.


