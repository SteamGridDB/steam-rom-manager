# Controller-Vorlagen
Mit Controller-Vorlagen können Sie das Button-Layout pro Controller und Parser konfigurieren.

Möglicherweise solltest du die `Cloud-Synchronisierung` in Steam deaktivieren, um zu vermeiden, dass deine SRM-zugewiesenen Controller-Einstellungen überschrieben werden. Die Einstellung findest du unter `Steam > Einstellungen > Cloud`.

Um eine benutzerdefinierte Vorlage erstellen:
* Öffne Steam.
* Schließe den Controller an, für den du eine Vorlage konfigurieren möchtest.
* Rechtsklick auf ein beliebiges Spiel und drücke `Verwalte > Controller Layout`.
* Konfiguriere die Buttons nach deinem Geschmack.
* Hit `Export Config` then `Save new template binding`.
* Name the template in the form: `Template Title (SRM)`. You must end the name with `(SRM)` or SRM will not pick up the template.
* Repeat for as many different types of controller as you want to configure.

In the SRM parser:
* Hit `Re-Fetch Controller Templates` to pull templates for all controller types from steam. This will clear your currently selected template if it is not one of the templates available in Steam.

Currently, SRM pulls all of the default (Valve made) templates for each controller as well as all of the user defined templates that end in `(SRM)`.

* Select your templates and save the parser. The controller configsets will be applied once you hit `Save App List` in the preview.

* To unset controller configs, you may either `Remove All Added App Entries` from global settings (this deletes all SRM made changes to your steam data) or hit `Unset All Controllers` in the parser (this only removes controller settings for the steam directory and user specified in that parser).

Once this is done you can generate and save the preview as usual, and the template will be applied to all the titles in the parser.


